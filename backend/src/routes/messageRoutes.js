import express from "express";
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction
} from "../controllers/messageController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     MessagePayload:
 *       type: object
 *       required: [content]
 *       properties:
 *         content:
 *           type: string
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *     EditMessagePayload:
 *       type: object
 *       required: [content]
 *       properties:
 *         content:
 *           type: string
 *     ReactionPayload:
 *       type: object
 *       required: [emoji]
 *       properties:
 *         emoji:
 *           type: string
 *
 * /api/groups/{groupId}/messages:
 *   post:
 *     tags: [Messages]
 *     summary: Send a message to a group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessagePayload'
 *     responses:
 *       201:
 *         description: Message sent
 *       400:
 *         description: Invalid message payload
 *       401:
 *         description: Unauthorized
 *   get:
 *     tags: [Messages]
 *     summary: Get messages from a group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Messages list returned
 *       401:
 *         description: Unauthorized
 *
 * /api/messages/{messageId}:
 *   put:
 *     tags: [Messages]
 *     summary: Edit an existing message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EditMessagePayload'
 *     responses:
 *       200:
 *         description: Message updated
 *       401:
 *         description: Unauthorized
 *   delete:
 *     tags: [Messages]
 *     summary: Delete a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted
 *       401:
 *         description: Unauthorized
 *
 * /api/messages/{messageId}/reactions:
 *   post:
 *     tags: [Messages]
 *     summary: Add reaction to a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReactionPayload'
 *     responses:
 *       200:
 *         description: Reaction added
 *       401:
 *         description: Unauthorized
 *   delete:
 *     tags: [Messages]
 *     summary: Remove reaction from a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: emoji
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reaction removed
 *       401:
 *         description: Unauthorized
 */

// All routes require authentication
router.use(authenticate);

// Group messages
router.post("/groups/:groupId/messages", sendMessage);
router.get("/groups/:groupId/messages", getMessages);

// Message actions
router.put("/messages/:messageId", editMessage);
router.delete("/messages/:messageId", deleteMessage);
router.post("/messages/:messageId/reactions", addReaction);
router.delete("/messages/:messageId/reactions", removeReaction);

export default router;
