import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
    searchUsers,
    getGroups,
    getGroupById,
    createGroup,
    joinGroup,
    leaveGroup,
    updateGroup,
    deleteGroup,
    inviteMember,
    addMember,
    removeMemberController,
} from "../controllers/groupController.js";

const router = express.Router();

router.use(authenticate);

// User search (for invitations)
router.get("/users/search", searchUsers);

// Group CRUD
router.get("/", getGroups);
router.post("/", createGroup);
router.get("/:groupId", getGroupById);
router.put("/:groupId", updateGroup);
router.delete("/:groupId", deleteGroup);

// Membership
router.post("/:groupId/join", joinGroup);
router.post("/:groupId/leave", leaveGroup);
router.post("/:groupId/invite", inviteMember);

// Member management (admin)
router.post("/:groupId/members", addMember);
router.delete("/:groupId/members/:memberId", removeMemberController);

export default router;
