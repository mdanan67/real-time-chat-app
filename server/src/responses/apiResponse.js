/**
 * Standard API response wrapper.
 * All API responses must use these helpers for consistency.
 */

class ApiResponse {
  static success(res, data = null, message = 'Operation successful', statusCode = 200) {
    return res.status(statusCode).json({
      status: true,
      statusCode,
      message,
      data,
    });
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(res, message = 'An error occurred', statusCode = 500, data = null) {
    return res.status(statusCode).json({
      status: false,
      statusCode,
      message,
      data,
    });
  }

  static badRequest(res, message = 'Bad request', data = null) {
    return ApiResponse.error(res, message, 400, data);
  }

  static unauthorized(res, message = 'Unauthorized') {
    return ApiResponse.error(res, message, 401);
  }

  static forbidden(res, message = 'Forbidden') {
    return ApiResponse.error(res, message, 403);
  }

  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404);
  }

  static conflict(res, message = 'Resource already exists') {
    return ApiResponse.error(res, message, 409);
  }

  static tooManyRequests(res, message = 'Too many requests') {
    return ApiResponse.error(res, message, 429);
  }

  static internalError(res, message = 'Internal server error') {
    return ApiResponse.error(res, message, 500);
  }
}

module.exports = ApiResponse;
