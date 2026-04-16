import express from "express";
import { protect } from "../middlewares/auth.js";
import {
    createPoll, getGroupPolls, votePoll, updatePoll, deletePoll
} from "../controllers/pollController.js";

const router = express.Router();

router.use(protect);

router.post("/groups/:groupId/polls", createPoll);
router.get("/groups/:groupId/polls", getGroupPolls);
router.post("/polls/:pollId/vote", votePoll);
router.put("/polls/:pollId", updatePoll);
router.delete("/polls/:pollId", deletePoll);

export default router;
