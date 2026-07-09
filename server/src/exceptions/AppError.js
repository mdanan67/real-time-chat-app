/**
 * Base application error class.
 * All custom errors should extend this class.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = false;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
