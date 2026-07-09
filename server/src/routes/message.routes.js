const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  sendMessageSchema,
  getMessagesSchema,
  editMessageSchema,
} = require('../validators/message.validator');

/**
 * @swagger
 * /api/v1/messages:
 *   post:
 *     tags: [Messages]
 *     summary: Send a message
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *               type: { type: string, enum: [TEXT, IMAGE, FILE] }
 *               conversationId: { type: string, format: uuid }
 *               groupId: { type: string, format: uuid }
 *               parentId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/', authenticate, validate(sendMessageSchema), messageController.send);

/**
 * @swagger
 * /api/v1/messages/conversations/{conversationId}:
 *   get:
 *     tags: [Messages]
 *     summary: Get messages for a conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get(
  '/conversations/:conversationId',
  authenticate,
  validate(getMessagesSchema),
  messageController.getConversationMessages
);

/**
 * @swagger
 * /api/v1/messages/groups/{groupId}:
 *   get:
 *     tags: [Messages]
 *     summary: Get messages for a group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get(
  '/groups/:groupId',
  authenticate,
  validate(getMessagesSchema),
  messageController.getGroupMessages
);

/**
 * @swagger
 * /api/v1/messages/{id}:
 *   patch:
 *     tags: [Messages]
 *     summary: Edit a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: Message edited successfully
 */
router.patch('/:id', authenticate, validate(editMessageSchema), messageController.edit);

/**
 * @swagger
 * /api/v1/messages/{id}:
 *   delete:
 *     tags: [Messages]
 *     summary: Delete a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Message deleted successfully
 */
router.delete('/:id', authenticate, messageController.delete);

/**
 * @swagger
 * /api/v1/messages/read:
 *   post:
 *     tags: [Messages]
 *     summary: Mark messages as read
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [messageIds]
 *             properties:
 *               messageIds: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.post('/read', authenticate, messageController.markAsRead);

module.exports = router;
