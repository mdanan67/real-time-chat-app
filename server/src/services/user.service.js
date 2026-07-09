const store = require('../database/database.postgrace');
const { NotFoundError } = require('../exceptions');

/**
 * UserService handles user-related business logic.
 */
class UserService {
  /**
   * Get the authenticated user's profile.
   */
  async getProfile(userId) { 
    const user = await store.findUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return store.sanitizeUser(user);
  }

  /**
   * Update the authenticated user's profile.
   */
  async updateProfile(userId, updates) {
    const allowedUpdates = {};
    if (updates.displayName) allowedUpdates.displayName = updates.displayName;
    if (updates.bio !== undefined) allowedUpdates.bio = updates.bio;
    if (updates.avatarUrl !== undefined) allowedUpdates.avatarUrl = updates.avatarUrl;

    const user = await store.updateUser(userId, allowedUpdates);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return store.sanitizeUser(user);
  }

  /**
   * Get another user's public profile.
   */
  async getPublicProfile(userId) {
    const user = await store.findUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return store.sanitizeUser(user);
  }

  /**
   * Search users by username or display name.
   */
  async searchUsers(query, page = 1, limit = 20, excludeUserId = null) {
    const skip = (page - 1) * limit;

    const allUsers = await store.findUsers();
    const queryLower = query.toLowerCase();

    let filtered = allUsers.filter((u) => {
      if (excludeUserId && u.id === excludeUserId) return false;
      return (
        u.username.toLowerCase().includes(queryLower) ||
        (u.displayName && u.displayName.toLowerCase().includes(queryLower))
      );
    });

    const total = filtered.length;

    // Sort by username asc
    filtered.sort((a, b) => a.username.localeCompare(b.username));

    const paginated = filtered.slice(skip, skip + limit);

    return {
      users: paginated.map((u) => store.sanitizeUser(u)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }
}

module.exports = new UserService();
