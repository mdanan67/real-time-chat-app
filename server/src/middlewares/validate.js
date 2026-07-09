const ApiResponse = require('../responses/apiResponse');

/**
 * Middleware factory that validates request data using Joi schemas.
 * @param {Object} schema - Joi schema object with body, params, query keys
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    };

    const errors = [];

    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, validationOptions);
      if (error) {
        errors.push(...error.details);
      } else {
        req.body = value;
      }
    }

    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, validationOptions);
      if (error) {
        errors.push(...error.details);
      } else {
        req.params = value;
      }
    }

    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, validationOptions);
      if (error) {
        errors.push(...error.details);
      } else {
        req.query = value;
      }
    }

    if (errors.length > 0) {
      const details = errors.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return ApiResponse.badRequest(res, 'Validation failed', details);
    }

    next();
  };
};

module.exports = validate;
