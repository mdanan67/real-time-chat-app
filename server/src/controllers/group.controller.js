const groupService = require('../services/group.service');
const ApiResponse = require('../responses/apiResponse');

/**
 * Group Controller - Handles group chat HTTP requests.
 */
class GroupController {
  async create(req, res, next) {
    try {
      const group = await groupService.createGroup(req.user.id, req.body);
      return ApiResponse.created(res, { group }, 'Group created successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await groupService.getUserGroups(req.user.id, page, limit);
      return ApiResponse.success(res, result, 'Groups retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const group = await groupService.getGroupById(req.params.id, req.user.id);
      return ApiResponse.success(res, { group }, 'Group retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const group = await groupService.updateGroup(req.params.id, req.user.id, req.body);
      return ApiResponse.success(res, { group }, 'Group updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async addMembers(req, res, next) {
    try {
      const group = await groupService.addMembers(req.params.id, req.user.id, req.body.memberIds);
      return ApiResponse.success(res, { group }, 'Members added successfully');
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      await groupService.removeMember(req.params.id, req.user.id, req.params.memberId);
      return ApiResponse.success(res, null, 'Member removed successfully');
    } catch (error) {
      next(error);
    }
  }

  async leave(req, res, next) {
    try {
      const result = await groupService.leaveGroup(req.params.id, req.user.id);
      const message = result.deleted
        ? 'Group deleted as you were the owner'
        : 'Left group successfully';
      return ApiResponse.success(res, result, message);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await groupService.deleteGroup(req.params.id, req.user.id);
      return ApiResponse.success(res, null, 'Group deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateMemberRole(req, res, next) {
    try {
      const member = await groupService.updateMemberRole(
        req.params.id,
        req.user.id,
        req.params.memberId,
        req.body.role
      );
      return ApiResponse.success(res, { member }, 'Member role updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GroupController();
