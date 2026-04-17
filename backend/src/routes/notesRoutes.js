import express from "express";
import { 
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

router.post("/notes", protect, createNote);

router.get("/notes", protect, getNotes);

router.get("/notes/my", protect, getMyNotes);

router.get("/notes/search", protect, searchNotes);

router.post("/notes/react", protect, reactToNote);

router.post("/notes/comment", protect, commentOnNote);

router.put("/notes/:noteId", protect, updateNote);

router.delete("/notes/:noteId", protect, deleteNote);

router.get("/notes/:noteId/comments", protect, getCommentsForNote);

export default router;
