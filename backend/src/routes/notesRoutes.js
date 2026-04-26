import express from "express";
import { 
  checkNotesEndpoint,
  createNote, 
  getNotes, 
  getMyNotes,
  searchNotes, 
  reactToNote, 
  commentOnNote,
  getCommentsForNote,
  updateNote,
  deleteNote,
} from "../controllers/notesController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     NoteCreateRequest:
 *       type: object
 *       required: [title, description]
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         onedriveLink:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         subject:
 *           type: string
 *         year:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *     NoteUpdateRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         onedriveLink:
 *           type: string
 *         tags:
 *           oneOf:
 *             - type: array
 *               items:
 *                 type: string
 *             - type: string
 *         subject:
 *           type: string
 *         year:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *     NoteReactionRequest:
 *       type: object
 *       required: [noteId, type]
 *       properties:
 *         noteId:
 *           type: string
 *         type:
 *           type: string
 *           enum: [like, dislike]
 *     NoteCommentRequest:
 *       type: object
 *       required: [noteId, commentText]
 *       properties:
 *         noteId:
 *           type: string
 *         commentText:
 *           type: string
 */

/**
 * @openapi
 * /api/notes/check:
 *   get:
 *     tags: [Notes]
 *     summary: Check Notes endpoint health
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notes endpoint is working
 */
router.get("/notes/check", protect, checkNotesEndpoint);

/**
 * @openapi
 * /api/notes:
 *   post:
 *     tags: [Notes]
 *     summary: Create a note
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NoteCreateRequest'
 *           example:
 *             title: DSA Past Paper Answers
 *             description: Solved answers for 2024 past paper.
 *             onedriveLink: https://1drv.ms/u/s!example
 *             tags: [dsa, past-paper]
 *             subject: Data Structures
 *             year: 2
 *     responses:
 *       201:
 *         description: Note created successfully
 */
router.post("/notes", protect, createNote);

/**
 * @openapi
 * /api/notes:
 *   get:
 *     tags: [Notes]
 *     summary: Get notes list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notes fetched successfully
 */
router.get("/notes", protect, getNotes);

/**
 * @openapi
 * /api/notes/my:
 *   get:
 *     tags: [Notes]
 *     summary: Get current user's notes
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: User notes fetched successfully
 */
router.get("/notes/my", protect, getMyNotes);

/**
 * @openapi
 * /api/notes/search:
 *   get:
 *     tags: [Notes]
 *     summary: Search notes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
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
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results returned
 */
router.get("/notes/search", protect, searchNotes);

/**
 * @openapi
 * /api/notes/react:
 *   post:
 *     tags: [Notes]
 *     summary: React to a note
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NoteReactionRequest'
 *           example:
 *             noteId: 64f1abc1234567890def1234
 *             type: like
 *     responses:
 *       200:
 *         description: Reaction updated or removed
 *       201:
 *         description: Reaction created
 */
router.post("/notes/react", protect, reactToNote);

/**
 * @openapi
 * /api/notes/comment:
 *   post:
 *     tags: [Notes]
 *     summary: Add a comment to a note
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NoteCommentRequest'
 *           example:
 *             noteId: 64f1abc1234567890def1234
 *             commentText: Thanks for sharing this.
 *     responses:
 *       201:
 *         description: Comment added
 */
router.post("/notes/comment", protect, commentOnNote);

/**
 * @openapi
 * /api/notes/{noteId}:
 *   put:
 *     tags: [Notes]
 *     summary: Update a note
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note updated
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NoteUpdateRequest'
 *           example:
 *             title: Updated DSA Notes
 *             tags: [dsa, revision]
 *             year: 2
 */
router.put("/notes/:noteId", protect, updateNote);

/**
 * @openapi
 * /api/notes/{noteId}:
 *   delete:
 *     tags: [Notes]
 *     summary: Delete a note
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note deleted
 */
router.delete("/notes/:noteId", protect, deleteNote);

/**
 * @openapi
 * /api/notes/{noteId}/comments:
 *   get:
 *     tags: [Notes]
 *     summary: Get comments for a note
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
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
 *         description: Comments fetched
 */
router.get("/notes/:noteId/comments", protect, getCommentsForNote);

export default router;
