const authService = require('../services/auth.service');
const ApiResponse = require('../responses/apiResponse');

/**
 * Auth Controller - Handles authentication HTTP requests.
 */
class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return ApiResponse.created(res, result, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const result = await authService.refreshToken(req.body.refreshToken);
      return ApiResponse.success(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.id);
      return ApiResponse.success(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      return ApiResponse.success(res, { user: req.user }, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
