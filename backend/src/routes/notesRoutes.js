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
 *     responses:
 *       200:
 *         description: Comments fetched
 */
router.get("/notes/:noteId/comments", protect, getCommentsForNote);

export default router;
