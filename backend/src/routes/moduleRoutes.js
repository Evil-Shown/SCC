import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  createModule,
  deleteModule,
  listModules,
  updateModule
} from "../controllers/moduleController.js";

const router = express.Router();

router.use(authenticate);

router.get("/modules", listModules);
router.post("/modules", createModule);
router.patch("/modules/:id", updateModule);
router.delete("/modules/:id", deleteModule);

export default router;

