const logger = require('../config/logger');
const ApiResponse = require('../responses/apiResponse');
const { AppError, ValidationError } = require('../exceptions');

/**
 * Global error handling middleware.
 * Catches all errors and returns a consistent API response.
 */
const errorHandler = (err, req, res, _next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token has expired');
  }

  // Validation errors from Joi
  if (err.isJoi) {
    const details = err.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return ApiResponse.badRequest(res, 'Validation failed', details);
  }

  // Our custom AppError
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors || null);
  }

  // Multer errors
  if (err.name === 'MulterError') {
    return ApiResponse.badRequest(res, err.message);
  }

  // Default server error
  return ApiResponse.internalError(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  );
};

module.exports = errorHandler;
