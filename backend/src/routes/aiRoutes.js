import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { chatWithAI, getAiModels } from "../controllers/aiController.js";

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

// General AI assistant chat
router.post("/chat", chatWithAI);
router.get("/models", getAiModels);

export default router;

