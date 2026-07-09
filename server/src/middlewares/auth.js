const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiResponse = require('../responses/apiResponse');
const store = require('../database/database.postgrace');

/**
 * Middleware to authenticate requests using JWT.
 * Extracts and verifies the access token from the Authorization header.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'Access token is required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return ApiResponse.unauthorized(res, 'Access token is required');
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret);

    const user = await store.findUserById(decoded.userId);

    if (!user) {
      return ApiResponse.unauthorized(res, 'User no longer exists');
    }

    req.user = store.sanitizeUser(user);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token has expired');
    }
    next(error);
  }
};

module.exports = { authenticate };
