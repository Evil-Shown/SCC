import express from "express";
import { 
  createKuppiPost,
  updateKuppiPost,
  addMeetingLink,
  applyToKuppi,
  getKuppiApplicants,
  exportKuppiApplicants,
  getKuppiPosts
} from "../controllers/kuppiController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/kuppi", protect, createKuppiPost);

router.put("/kuppi/:postId", protect, updateKuppiPost);

router.get("/kuppi", protect, getKuppiPosts);

router.post("/kuppi/apply", protect, applyToKuppi);

router.patch("/kuppi/:postId/link", protect, addMeetingLink);

router.get("/kuppi/applicants/:postId", protect, getKuppiApplicants);

router.get("/kuppi/export/:postId", protect, exportKuppiApplicants);

export default router;
