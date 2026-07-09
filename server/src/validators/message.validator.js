const Joi = require('joi');

const sendMessageSchema = {
  body: Joi.object({
    content: Joi.string().max(5000).optional(),
    type: Joi.string().valid('TEXT', 'IMAGE', 'FILE').default('TEXT'),
    conversationId: Joi.string().uuid().optional(),
    groupId: Joi.string().uuid().optional(),
    parentId: Joi.string().uuid().optional(),
  })
    .xor('conversationId', 'groupId')
    .messages({
      'object.xor': 'Provide either conversationId OR groupId, not both',
    }),
};

const getMessagesSchema = {
  query: Joi.object({
    cursor: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).default(50),
  }),
};

const editMessageSchema = {
  body: Joi.object({
    content: Joi.string().max(5000).required().messages({
      'any.required': 'Content is required',
    }),
  }),
};

module.exports = {
  sendMessageSchema,
  getMessagesSchema,
  editMessageSchema,
};
