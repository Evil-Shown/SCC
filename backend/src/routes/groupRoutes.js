import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
    // User search
    searchUsers,
    // Group CRUD
    getGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    // Membership
    joinGroup,
    leaveGroup,
    removeMemberController,
    changeMemberRole,
    transferOwnership,
    // Formal invites
    sendInvite,
    listGroupInvites,
    myInvites,
    acceptInvite,
    declineInvite,
    revokeInvite,
    // Activity log
    getGroupActivity,
} from "../controllers/groupController.js";
import {
    validateCreateGroup,
    validateUpdateGroup,
    validateInvite,
    validatePromoteRole,
} from "../middlewares/groupValidation.js";

const router = express.Router();

// All group routes require authentication
router.use(authenticate);

// ── User search (for invite autocomplete) ──────────────────
router.get("/users/search", searchUsers);

// ── Personal invite inbox ──────────────────────────────────
// Must be declared before /:groupId to avoid conflict
router.get("/invites/me", myInvites);
router.patch("/invites/:inviteId/accept", acceptInvite);
router.patch("/invites/:inviteId/decline", declineInvite);

// ── Group CRUD ─────────────────────────────────────────────
router.get("/", getGroups);
router.post("/", validateCreateGroup, createGroup);
router.get("/:groupId", getGroupById);
router.put("/:groupId", validateUpdateGroup, updateGroup);
router.delete("/:groupId", deleteGroup);

// ── Membership ─────────────────────────────────────────────
router.post("/:groupId/join", joinGroup);
router.post("/:groupId/leave", leaveGroup);

// ── Member management (admin/owner) ───────────────────────
router.delete("/:groupId/members/:memberId", removeMemberController);
router.put("/:groupId/members/:memberId/role", validatePromoteRole, changeMemberRole);
router.post("/:groupId/transfer-ownership", transferOwnership);

// ── Formal invites (admin/owner sends; invitee accepts/declines) ──
router.post("/:groupId/invites", validateInvite, sendInvite);
router.get("/:groupId/invites", listGroupInvites);
router.patch("/:groupId/invites/:inviteId/revoke", revokeInvite);

// ── Activity log ───────────────────────────────────────────
router.get("/:groupId/activity", getGroupActivity);

export default router;
