const store = require('../database/database.postgrace');
const { NotFoundError, AuthorizationError, ValidationError } = require('../exceptions');
const { pool } = require('../database/database.postgrace');

/**
 * GroupService handles group chat business logic.
 */
class GroupService {
  /**
   * Create a new group.
   */
  async createGroup(creatorId, { name, description, memberIds }) {
    const group = await store.createGroup({
      name,
      description,
      createdById: creatorId,
    });

    // Add creator as OWNER
    await store.createGroupMember({ userId: creatorId, groupId: group.id, role: 'OWNER' });

    // Add other members
    if (memberIds && memberIds.length > 0) {
      for (const id of memberIds) {
        if (id !== creatorId) {
          await store.createGroupMember({ userId: id, groupId: group.id, role: 'MEMBER' });
        }
      }
    }

    return this._formatGroup(group.id);
  }

  /**
   * Get all groups for the current user.
   */
  async getUserGroups(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const userGroupIds = await store.getUserGroupIds(userId);

    let groups = [];
    for (const gid of userGroupIds) {
      const g = await store.findGroupById(gid);
      if (g) groups.push(g);
    }

    const total = groups.length;

    // Sort by updatedAt desc
    groups.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    groups = groups.slice(skip, skip + limit);

    return {
      groups: await Promise.all(groups.map((g) => this._formatGroup(g.id))),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Get group by ID.
   */
  async getGroupById(groupId, userId) {
    const group = await store.findGroupById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify membership
    const member = await store.findGroupMember({ userId, groupId });
    if (!member) {
      throw new NotFoundError('Group not found');
    }

    return this._formatGroup(groupId);
  }

  /**
   * Get a formatted group by ID without checking a specific viewer.
   * Used after membership was already verified by the message flow.
   */
  async getGroupSnapshot(groupId) {
    return this._formatGroup(groupId);
  }

  /**
   * Update group information.
   */
  async updateGroup(groupId, userId, updates) {
    await this.verifyAdminOrOwner(groupId, userId);

    await store.updateGroup(groupId, updates);

    return this._formatGroup(groupId);
  }

  /**
   * Add members to group.
   */
  async addMembers(groupId, userId, memberIds) {
    await this.verifyAdminOrOwner(groupId, userId);

    const newMemberIds = [];
    for (const id of memberIds) {
      const existing = await store.findGroupMember({ userId: id, groupId });
      if (!existing) {
        await store.createGroupMember({ userId: id, groupId, role: 'MEMBER' });
        newMemberIds.push(id);
      }
    }

    if (newMemberIds.length === 0) {
      throw new ValidationError('All users are already members');
    }

    return this._formatGroup(groupId);
  }

  /**
   * Remove a member from group.
   */
  async removeMember(groupId, requesterId, memberIdToRemove) {
    await this.verifyAdminOrOwner(groupId, requesterId);

    const member = await store.findGroupMember({ userId: memberIdToRemove, groupId });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    if (member.role === 'OWNER') {
      throw new ValidationError('Cannot remove the group owner');
    }

    await store.deleteGroupMember(memberIdToRemove, groupId);
  }

  /**
   * Leave a group.
   */
  async leaveGroup(groupId, userId) {
    const member = await store.findGroupMember({ userId, groupId });

    if (!member) {
      throw new NotFoundError('You are not a member of this group');
    }

    if (member.role === 'OWNER') {
      // Transfer ownership to another admin or delete the group
      const members = await store.getGroupMembers(groupId);
      const anotherAdmin = members.find((m) => m.role === 'ADMIN' && m.userId !== userId);

      if (anotherAdmin) {
        await store.createGroupMember({
          userId: anotherAdmin.userId,
          groupId,
          role: 'OWNER',
        });
        await store.deleteGroupMember(anotherAdmin.userId, groupId);
      } else {
        // Delete the group if no other admins
        await pool.query('DELETE FROM groups_table WHERE id = $1', [groupId]);
        // Clean up members
        for (const m of members) {
          await store.deleteGroupMember(m.userId, groupId);
        }
        return { deleted: true };
      }
    }

    await store.deleteGroupMember(userId, groupId);
    return { deleted: false };
  }

  /**
   * Delete group (owner only).
   */
  async deleteGroup(groupId, userId) {
    const member = await store.findGroupMember({ userId, groupId });

    if (!member || member.role !== 'OWNER') {
      throw new AuthorizationError('Only the group owner can delete the group');
    }

    // Clean up members
    const members = await store.getGroupMembers(groupId);
    for (const m of members) {
      await store.deleteGroupMember(m.userId, groupId);
    }

    await pool.query('DELETE FROM groups_table WHERE id = $1', [groupId]);
  }

  /**
   * Update member role (admin or owner only).
   */
  async updateMemberRole(groupId, requesterId, memberId, newRole) {
    await this.verifyAdminOrOwner(groupId, requesterId);

    const member = await store.findGroupMember({ userId: memberId, groupId });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    if (member.role === 'OWNER') {
      throw new ValidationError('Cannot change the owner role');
    }

    await store.createGroupMember({
      userId: memberId,
      groupId,
      role: newRole,
    });
    await store.deleteGroupMember(memberId, groupId);

    const user = await store.findUserById(memberId);
    return {
      ...member,
      role: newRole,
      user: user ? store.sanitizeUser(user) : null,
    };
  }

  /**
   * Verify the requester is an admin or owner of the group.
   */
  async verifyAdminOrOwner(groupId, userId) {
    const member = await store.findGroupMember({ userId, groupId });

    if (!member) {
      throw new NotFoundError('Group not found');
    }

    if (member.role !== 'ADMIN' && member.role !== 'OWNER') {
      throw new AuthorizationError('Only admins can perform this action');
    }

    return member;
  }

  /**
   * Format group with members and creator info.
   */
  async _formatGroup(groupId) {
    const group = await store.findGroupById(groupId);
    if (!group) return null;

    const members = await store.getGroupMembers(groupId);
    const formattedMembers = await Promise.all(
      members.map(async (m) => {
        const user = await store.findUserById(m.userId);
        return {
          ...m,
          user: user ? store.sanitizeUser(user) : null,
        };
      })
    );

    const creator = await store.findUserById(group.createdById);

    const groupMessages = await store.findMessages({ groupId, isDeleted: false }, { take: 1 });

    return {
      ...group,
      members: formattedMembers,
      creator: creator ? store.sanitizeUser(creator) : null,
      messages: groupMessages.slice(0, 1),
    };
  }
}

module.exports = new GroupService();
