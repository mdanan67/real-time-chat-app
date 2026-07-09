const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  createGroupSchema,
  updateGroupSchema,
  addMembersSchema,
  updateMemberRoleSchema,
} = require('../validators/group.validator');

/**
 * @swagger
 * /api/v1/groups:
 *   post:
 *     tags: [Groups]
 *     summary: Create a new group
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, memberIds]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               memberIds: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       201:
 *         description: Group created successfully
 */
router.post('/', authenticate, validate(createGroupSchema), groupController.create);

/**
 * @swagger
 * /api/v1/groups:
 *   get:
 *     tags: [Groups]
 *     summary: Get all groups for current user
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
 *         description: Groups retrieved successfully
 */
router.get('/', authenticate, groupController.getAll);

/**
 * @swagger
 * /api/v1/groups/{id}:
 *   get:
 *     tags: [Groups]
 *     summary: Get group by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Group retrieved successfully
 */
router.get('/:id', authenticate, groupController.getById);

/**
 * @swagger
 * /api/v1/groups/{id}:
 *   patch:
 *     tags: [Groups]
 *     summary: Update group information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               avatarUrl: { type: string }
 *     responses:
 *       200:
 *         description: Group updated successfully
 */
router.patch('/:id', authenticate, validate(updateGroupSchema), groupController.update);

/**
 * @swagger
 * /api/v1/groups/{id}/members:
 *   post:
 *     tags: [Groups]
 *     summary: Add members to group
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
 *             required: [memberIds]
 *             properties:
 *               memberIds: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Members added successfully
 */
router.post('/:id/members', authenticate, validate(addMembersSchema), groupController.addMembers);

/**
 * @swagger
 * /api/v1/groups/{id}/members/{memberId}:
 *   delete:
 *     tags: [Groups]
 *     summary: Remove a member from group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Member removed successfully
 */
router.delete('/:id/members/:memberId', authenticate, groupController.removeMember);

/**
 * @swagger
 * /api/v1/groups/{id}/leave:
 *   post:
 *     tags: [Groups]
 *     summary: Leave a group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Left group successfully
 */
router.post('/:id/leave', authenticate, groupController.leave);

/**
 * @swagger
 * /api/v1/groups/{id}:
 *   delete:
 *     tags: [Groups]
 *     summary: Delete a group (owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Group deleted successfully
 */
router.delete('/:id', authenticate, groupController.delete);

/**
 * @swagger
 * /api/v1/groups/{id}/members/{memberId}/role:
 *   patch:
 *     tags: [Groups]
 *     summary: Update member role (admin/owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [ADMIN, MEMBER] }
 *     responses:
 *       200:
 *         description: Member role updated successfully
 */
router.patch(
  '/:id/members/:memberId/role',
  authenticate,
  validate(updateMemberRoleSchema),
  groupController.updateMemberRole
);

module.exports = router;
