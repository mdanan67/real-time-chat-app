const Joi = require('joi');

const updateProfileSchema = {
  body: Joi.object({
    displayName: Joi.string().min(2).max(50).optional(),
    bio: Joi.string().max(500).optional().allow(''),
    avatarUrl: Joi.string().uri().optional().allow(''),
  }),
};

const searchUsersSchema = {
  query: Joi.object({
    q: Joi.string().min(1).max(50).required().messages({
      'any.required': 'Search query is required',
    }),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }),
};

module.exports = {
  updateProfileSchema,
  searchUsersSchema,
};
