const Joi = require('joi');

const createGroupSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'any.required': 'Group name is required',
      'string.min': 'Group name must be at least 2 characters',
    }),
    description: Joi.string().max(500).optional().allow(''),
    memberIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
      'any.required': 'At least one member is required',
      'array.min': 'Add at least one member to the group',
    }),
  }),
};

const updateGroupSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional().allow(''),
    avatarUrl: Joi.string().uri().optional().allow(''),
  }),
};

const addMembersSchema = {
  body: Joi.object({
    memberIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
      'any.required': 'Member IDs are required',
    }),
  }),
};

const updateMemberRoleSchema = {
  body: Joi.object({
    role: Joi.string().valid('ADMIN', 'MEMBER').required().messages({
      'any.required': 'Role is required',
      'any.only': 'Role must be ADMIN or MEMBER',
    }),
  }),
};

module.exports = {
  createGroupSchema,
  updateGroupSchema,
  addMembersSchema,
  updateMemberRoleSchema,
};
