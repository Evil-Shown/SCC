import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
    createGroupMeetup,
    getGroupMeetups,
    getMeetupById,
    activateMeetup,
    voteOnMeetup,
    completeMeetup,
} from "../controllers/meetupController.js";

const router = express.Router();

// Group-scoped meetup routes
router.post("/groups/:groupId/meetups", authenticate, createGroupMeetup);
router.get("/groups/:groupId/meetups", authenticate, getGroupMeetups);

// Individual meetup routes
router.get("/meetups/:id", authenticate, getMeetupById);
router.post("/meetups/:id/activate", authenticate, activateMeetup);
router.post("/meetups/:id/vote", authenticate, voteOnMeetup);
router.post("/meetups/:id/complete", authenticate, completeMeetup);

export default router;
