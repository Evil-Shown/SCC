import express from "express";
import { authenticate } from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";
import {
  createResource,
  deleteAllResources,
  deleteResource,
  importResourcesFromFile,
  listResources,
  updateResource
} from "../controllers/resourceController.js";

const router = express.Router();

router.use(authenticate);

router.get("/resources", listResources);
router.post("/resources", createResource);
router.delete("/resources/all", deleteAllResources);
router.patch("/resources/:id", updateResource);
router.delete("/resources/:id", deleteResource);
router.post("/resources/import", upload.single("file"), importResourcesFromFile);

export default router;

