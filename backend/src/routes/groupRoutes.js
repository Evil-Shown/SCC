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

/**
 * @openapi
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         moduleCode:
 *           type: string
 *         visibility:
 *           type: string
 *           enum: [public, private]
 *     CreateGroupRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         moduleCode:
 *           type: string
 *         visibility:
 *           type: string
 *           enum: [public, private]
 *     UpdateGroupRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         moduleCode:
 *           type: string
 *         visibility:
 *           type: string
 *           enum: [public, private]
 *     InviteRequest:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [member, admin]
 *     RoleChangeRequest:
 *       type: object
 *       required: [role]
 *       properties:
 *         role:
 *           type: string
 *           enum: [member, admin]
 *     TransferOwnershipRequest:
 *       type: object
 *       required: [newOwnerId]
 *       properties:
 *         newOwnerId:
 *           type: string
 *
 * /api/groups/users/search:
 *   get:
 *     tags: [Groups]
 *     summary: Search users for group invite autocomplete
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search term for user lookup
 *     responses:
 *       200:
 *         description: Matching users list
 *
 * /api/groups/invites/me:
 *   get:
 *     tags: [Groups]
 *     summary: List invites for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personal invite inbox
 *
 * /api/groups/invites/{inviteId}/accept:
 *   patch:
 *     tags: [Groups]
 *     summary: Accept a personal invite
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite accepted
 *
 * /api/groups/invites/{inviteId}/decline:
 *   patch:
 *     tags: [Groups]
 *     summary: Decline a personal invite
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite declined
 *
 * /api/groups:
 *   get:
 *     tags: [Groups]
 *     summary: Get groups available to the user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group list fetched
 *   post:
 *     tags: [Groups]
 *     summary: Create a new group
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGroupRequest'
 *     responses:
 *       201:
 *         description: Group created
 *       400:
 *         description: Validation failed
 *
 * /api/groups/{groupId}:
 *   get:
 *     tags: [Groups]
 *     summary: Get one group by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group details
 *   put:
 *     tags: [Groups]
 *     summary: Update a group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateGroupRequest'
 *     responses:
 *       200:
 *         description: Group updated
 *   delete:
 *     tags: [Groups]
 *     summary: Delete a group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group deleted
 *
 * /api/groups/{groupId}/join:
 *   post:
 *     tags: [Groups]
 *     summary: Join a group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group joined
 *
 * /api/groups/{groupId}/leave:
 *   post:
 *     tags: [Groups]
 *     summary: Leave a group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group left
 *
 * /api/groups/{groupId}/members/{memberId}:
 *   delete:
 *     tags: [Groups]
 *     summary: Remove a member from group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed
 *
 * /api/groups/{groupId}/members/{memberId}/role:
 *   put:
 *     tags: [Groups]
 *     summary: Change a member role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleChangeRequest'
 *     responses:
 *       200:
 *         description: Role updated
 *
 * /api/groups/{groupId}/transfer-ownership:
 *   post:
 *     tags: [Groups]
 *     summary: Transfer group ownership
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferOwnershipRequest'
 *     responses:
 *       200:
 *         description: Ownership transferred
 *
 * /api/groups/{groupId}/invites:
 *   post:
 *     tags: [Groups]
 *     summary: Send invite to user for this group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InviteRequest'
 *     responses:
 *       201:
 *         description: Invite sent
 *   get:
 *     tags: [Groups]
 *     summary: List invites for one group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group invites list
 *
 * /api/groups/{groupId}/invites/{inviteId}/revoke:
 *   patch:
 *     tags: [Groups]
 *     summary: Revoke a group invite
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite revoked
 *
 * /api/groups/{groupId}/activity:
 *   get:
 *     tags: [Groups]
 *     summary: Get group activity log
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity log returned
 */

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
