const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  createConversationSchema,
  getConversationsSchema,
} = require('../validators/conversation.validator');

/**
 * @swagger
 * /api/v1/conversations:
 *   post:
 *     tags: [Conversations]
 *     summary: Create or get existing one-to-one conversation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [participantId]
 *             properties:
 *               participantId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 */
router.post(
  '/',
  authenticate,
  validate(createConversationSchema),
  conversationController.createOrGet
);

/**
 * @swagger
 * /api/v1/conversations:
 *   get:
 *     tags: [Conversations]
 *     summary: Get all conversations for current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 */
router.get('/', authenticate, validate(getConversationsSchema), conversationController.getAll);

/**
 * @swagger
 * /api/v1/conversations/{id}:
 *   get:
 *     tags: [Conversations]
 *     summary: Get conversation by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 */
router.get('/:id', authenticate, conversationController.getById);

module.exports = router;
