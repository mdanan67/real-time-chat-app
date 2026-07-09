const userService = require('../services/user.service');
const ApiResponse = require('../responses/apiResponse');

/**
 * User Controller - Handles user-related HTTP requests.
 */
class UserController {
  async getProfile(req, res, next) {
    try {
      const user = await userService.getProfile(req.user.id);
      return ApiResponse.success(res, { user }, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user.id, req.body);
      return ApiResponse.success(res, { user }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getPublicProfile(req.params.id);
      return ApiResponse.success(res, { user }, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req, res, next) {
    try {
      const { q, page, limit } = req.query;
      const result = await userService.searchUsers(q, page, limit, req.user.id);
      return ApiResponse.success(res, result, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
