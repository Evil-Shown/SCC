import express from "express";
import { 
  createNote, 
  getNotes, 
  searchNotes, 
  reactToNote, 
  commentOnNote,
  getCommentsForNote
} from "../controllers/notesController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/notes", protect, createNote);

router.get("/notes", protect, getNotes);

router.get("/notes/search", protect, searchNotes);

router.post("/notes/react", protect, reactToNote);

router.post("/notes/comment", protect, commentOnNote);

router.get("/notes/:noteId/comments", protect, getCommentsForNote);

export default router;
