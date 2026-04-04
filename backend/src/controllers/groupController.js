import User from "../models/User.js";
import Group from "../models/Group.js";
import GroupInvite from "../models/GroupInvite.js";
import GroupActivity from "../models/GroupActivity.js";
import { createNotification } from "../services/notificationService.js";
import { GROUP_ACTIONS } from "../models/GroupActivity.js";

/* ──────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────── */

/** Emit a socket event (non-fatal if io is absent) */
const emit = (req, room, event, payload) => {
    const io = req.app.get("io");
    if (io) io.to(room).emit(event, payload);
};

/** Log an activity entry and push it via socket if io is available */
const logActivity = async (groupId, actorId, action, targetId = null, meta = {}, io = null) => {
    try {
        const created = await GroupActivity.create({ group: groupId, actor: actorId, action, target: targetId || undefined, meta });
        const populated = await GroupActivity.findById(created._id)
            .populate("actor", "name email profilePicture")
            .populate("target", "name email profilePicture");
        if (io && populated) {
            io.to(`group-${groupId}`).emit("group:activity", { groupId, activity: populated });
        }
        return populated;
    } catch (e) {
        console.error("logActivity error:", e.message);
    }
};

/* ──────────────────────────────────────────────────────────
   USER SEARCH (for invite autocomplete)
   ────────────────────────────────────────────────────────── */

/**
 * GET /api/groups/users/search?q=name
 */
export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const query = { _id: { $ne: req.user._id } };
        if (q && q.trim().length > 0) {
            const regex = new RegExp(q.trim(), "i");
            query.$or = [{ name: regex }, { email: regex }];
        }
        const users = await User.find(query)
            .select("name email profilePicture")
            .sort({ name: 1 })
            .limit(50);
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error("searchUsers error:", error);
        res.status(500).json({ success: false, message: "Error searching users" });
    }
};

/* ──────────────────────────────────────────────────────────
   GROUPS CRUD
   ────────────────────────────────────────────────────────── */

/**
 * GET /api/groups?search=&myGroups=true&page=1&limit=20&sort=createdAt
 */
export const getGroups = async (req, res) => {
    try {
        const { search, myGroups, page = 1, limit = 20, sort = "createdAt" } = req.query;
        const userId = req.user._id;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = { isActive: true };

        if (myGroups === "true") {
            query["members.user"] = userId;
        } else {
            query.$or = [{ isPublic: true }, { "members.user": userId }];
        }

        if (search) {
            const searchRegex = { $regex: search.trim(), $options: "i" };
            query.$and = [
                {
                    $or: [
                        { name: searchRegex },
                        { subject: searchRegex },
                        { courseCode: searchRegex },
                    ],
                },
            ];
        }

        const sortMap = {
            createdAt: { createdAt: -1 },
            memberCount: { "members.length": -1 }, // approximation; kept for API compat
            name: { name: 1 },
        };
        const sortOrder = sortMap[sort] || { createdAt: -1 };

        const [groups, total] = await Promise.all([
            Group.find(query)
                .populate("creator", "name email profilePicture")
                .populate("members.user", "name email profilePicture")
                .sort(sortOrder)
                .skip(skip)
                .limit(parseInt(limit)),
            Group.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: groups,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("getGroups error:", error);
        res.status(500).json({ success: false, message: "Error fetching groups" });
    }
};

/**
 * GET /api/groups/:groupId
 */
export const getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId)
            .populate("creator", "name email profilePicture")
            .populate("members.user", "name email profilePicture")
            .populate("admins", "name email profilePicture");

        if (!group || !group.isActive) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        res.status(200).json({ success: true, data: group });
    } catch (error) {
        console.error("getGroupById error:", error);
        res.status(500).json({ success: false, message: "Error fetching group" });
    }
};

/**
 * POST /api/groups
 */
export const createGroup = async (req, res) => {
    try {
        const { name, description, subject, courseCode, tags, isPublic, allowMemberInvites, maxMembers } =
            req.body;
        const userId = req.user._id;

        const group = new Group({
            name: name.trim(),
            description: description?.trim() || "",
            subject: subject?.trim() || "",
            courseCode: courseCode?.trim() || "",
            tags: Array.isArray(tags) ? tags : [],
            isPublic: isPublic !== false,
            isActive: true,
            creator: userId,
            admins: [userId],
            members: [{ user: userId, role: "admin", joinedAt: new Date() }],
            settings: {
                isPublic: isPublic !== false,
                allowMemberInvites: allowMemberInvites !== false,
                maxMembers: maxMembers || 50,
            },
        });

        await group.save();
        await group.populate("creator", "name email profilePicture");
        await group.populate("members.user", "name email profilePicture");

        await logActivity(group._id, userId, GROUP_ACTIONS.GROUP_CREATED, null, { name: group.name }, req.app.get("io"));
        emit(req, userId.toString(), "group:created", { group });

        res.status(201).json({ success: true, message: "Group created successfully", data: group });
    } catch (error) {
        console.error("createGroup error:", error);
        res.status(500).json({ success: false, message: "Error creating group" });
    }
};

/**
 * PUT /api/groups/:groupId   (admin/owner only — enforced via requireGroupRole)
 */
export const updateGroup = async (req, res) => {
    try {
        const group = req.group || await Group.findById(req.params.groupId);
        const userId = req.user._id;

        if (!group || !group.isActive) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }
        if (!group.isAdmin(userId)) {
            return res.status(403).json({ success: false, message: "Only admins can update the group" });
        }

        const { name, description, subject, courseCode, tags, isPublic, allowMemberInvites, maxMembers } =
            req.body;
        const prevName = group.name;

        if (name) group.name = name.trim();
        if (description !== undefined) group.description = description;
        if (subject !== undefined) group.subject = subject;
        if (courseCode !== undefined) group.courseCode = courseCode;
        if (tags !== undefined) group.tags = tags;
        if (isPublic !== undefined) {
            group.isPublic = isPublic;
            group.settings.isPublic = isPublic;
        }
        if (allowMemberInvites !== undefined) group.settings.allowMemberInvites = allowMemberInvites;
        if (maxMembers !== undefined) group.settings.maxMembers = maxMembers;

        await group.save();
        await group.populate("creator", "name email profilePicture");
        await group.populate("members.user", "name email profilePicture");

        await logActivity(group._id, userId, GROUP_ACTIONS.GROUP_UPDATED, null, {
            prevName,
            newName: group.name,
        }, req.app.get("io"));
        emit(req, `group-${group._id}`, "group:updated", { group });

        res.status(200).json({ success: true, message: "Group updated", data: group });
    } catch (error) {
        console.error("updateGroup error:", error);
        res.status(500).json({ success: false, message: "Error updating group" });
    }
};

/**
 * DELETE /api/groups/:groupId   (owner only)
 */
export const deleteGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        const userId = req.user._id;

        if (!group || !group.isActive) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }
        if (group.creator?.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only the owner can delete this group" });
        }

        // Soft delete
        group.isActive = false;
        await group.save();

        // Clean up pending invites
        await GroupInvite.updateMany(
            { group: group._id, status: "pending" },
            { $set: { status: "expired" } }
        );

        await logActivity(group._id, userId, GROUP_ACTIONS.GROUP_DELETED, null, { name: group.name }, req.app.get("io"));
        emit(req, `group-${group._id}`, "group:deleted", { groupId: group._id });

        res.status(200).json({ success: true, message: "Group deleted successfully" });
    } catch (error) {
        console.error("deleteGroup error:", error);
        res.status(500).json({ success: false, message: "Error deleting group" });
    }
};

/* ──────────────────────────────────────────────────────────
   MEMBERSHIP
   ────────────────────────────────────────────────────────── */

/**
 * POST /api/groups/:groupId/join
 */
export const joinGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        const userId = req.user._id;

        if (!group || !group.isActive) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }
        if (!group.isPublic) {
            return res
                .status(403)
                .json({ success: false, message: "This group is private. You need an invitation." });
        }
        if (group.isMember(userId)) {
            return res.status(400).json({ success: false, message: "You are already a member" });
        }

        const maxMembers = group.settings?.maxMembers || 50;
        if (group.members.length >= maxMembers) {
            return res.status(400).json({ success: false, message: "Group is full" });
        }

        group.addMember(userId);
        await group.save();
        await group.populate("creator", "name email profilePicture");
        await group.populate("members.user", "name email profilePicture");

        await logActivity(group._id, userId, GROUP_ACTIONS.MEMBER_JOINED, userId, { name: req.user.name }, req.app.get("io"));
        emit(req, `group-${group._id}`, "group:memberJoined", { groupId: group._id, userId });

        res.status(200).json({ success: true, message: "Successfully joined group", data: group });
    } catch (error) {
        console.error("joinGroup error:", error);
        res.status(500).json({ success: false, message: "Error joining group" });
    }
};

/**
 * POST /api/groups/:groupId/leave
 */
export const leaveGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        const userId = req.user._id;

        if (!group || !group.isActive) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }
        if (!group.isMember(userId)) {
            return res.status(400).json({ success: false, message: "You are not a member" });
        }
        if (group.creator?.toString() === userId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Owner cannot leave. Transfer ownership or delete the group.",
            });
        }

        group.removeMember(userId);
        // Also remove from admins array if present
        group.admins = group.admins.filter((a) => a.toString() !== userId.toString());
        await group.save();

        await logActivity(group._id, userId, GROUP_ACTIONS.MEMBER_LEFT, userId, { name: req.user.name }, req.app.get("io"));
        emit(req, `group-${group._id}`, "group:memberLeft", { groupId: group._id, userId });

        res.status(200).json({ success: true, message: "Successfully left group", data: { groupId: group._id } });
    } catch (error) {
        console.error("leaveGroup error:", error);
        res.status(500).json({ success: false, message: "Error leaving group" });
    }
};

/* ──────────────────────────────────────────────────────────
   MEMBER MANAGEMENT (admin/owner only)
   ────────────────────────────────────────────────────────── */

/**
 * DELETE /api/groups/:groupId/members/:memberId
 */
export const removeMemberController = async (req, res) => {
    try {
        const group = req.group || await Group.findById(req.params.groupId);
        const userId = req.user._id;
        const { memberId } = req.params;

        if (!group || !group.isActive) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }
        if (!group.isAdmin(userId)) {
            return res.status(403).json({ success: false, message: "Only admins can remove members" });
        }
        if (memberId === (group.creator?._id || group.creator)?.toString()) {
            return res.status(400).json({ success: false, message: "Cannot remove the group owner" });
        }
        // Admin cannot remove another admin (only owner can)
        const targetIsAdmin = group.admins.some((a) => (a._id || a).toString() === memberId);
        if (targetIsAdmin && !req.isOwner) {
            return res
                .status(403)
                .json({ success: false, message: "Only the owner can remove another admin" });
        }

        group.removeMember(memberId);
        group.admins = group.admins.filter((a) => (a._id || a).toString() !== memberId);
        await group.save();

        const removedUser = await User.findById(memberId).select("name");
        await logActivity(group._id, userId, GROUP_ACTIONS.MEMBER_REMOVED, memberId, {
            removedName: removedUser?.name,
        }, req.app.get("io"));
        emit(req, `group-${group._id}`, "group:memberLeft", { groupId: group._id, userId: memberId });

        res.status(200).json({ success: true, message: "Member removed", data: { memberId } });
    } catch (error) {
        console.error("removeMember error:", error);
        res.status(500).json({ success: false, message: "Error removing member" });
    }
};

/**
 * PUT /api/groups/:groupId/members/:memberId/role
 * Body: { role: "admin" | "member" }
 * Owner can promote/demote anyone; admin cannot change other admins.
 */
export const changeMemberRole = async (req, res) => {
    try {
        const group = req.group || await Group.findById(req.params.groupId);
        const userId = req.user._id;
        const { memberId } = req.params;
        const { role } = req.body;

        if (!group || !group.isActive) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }
        if (!group.isAdmin(userId)) {
            return res.status(403).json({ success: false, message: "Only admins can change roles" });
        }

        const creatorId = (group.creator?._id || group.creator)?.toString();
        if (memberId === creatorId) {
            return res.status(400).json({ success: false, message: "Cannot change the owner's role" });
        }

        const targetIsAdmin = group.admins.some((a) => (a._id || a).toString() === memberId);
        // Only owner can demote an admin
        if (targetIsAdmin && role === "member" && userId.toString() !== creatorId) {
            return res
                .status(403)
                .json({ success: false, message: "Only the owner can demote an admin" });
        }

        const memberEntry = group.members.find(
            (m) => (m.user?._id || m.user).toString() === memberId
        );
        if (!memberEntry) {
            return res.status(404).json({ success: false, message: "Member not found in this group" });
        }

        memberEntry.role = role;
        if (role === "admin") {
            if (!group.admins.some((a) => (a._id || a).toString() === memberId)) {
                group.admins.push(memberId);
            }
        } else {
            group.admins = group.admins.filter((a) => (a._id || a).toString() !== memberId);
        }

        await group.save();

        const action =
            role === "admin" ? GROUP_ACTIONS.ROLE_PROMOTED : GROUP_ACTIONS.ROLE_DEMOTED;
        const targetUser = await User.findById(memberId).select("name");
        await logActivity(group._id, userId, action, memberId, {
            targetName: targetUser?.name,
            newRole: role,
        }, req.app.get("io"));
        emit(req, `group-${group._id}`, "group:roleChanged", {
            groupId: group._id,
            memberId,
            newRole: role,
        });

        res.status(200).json({ success: true, message: `Member role updated to ${role}`, data: { memberId, role } });
    } catch (error) {
        console.error("changeMemberRole error:", error);
        res.status(500).json({ success: false, message: "Error changing member role" });
    }
};

/**
 * POST /api/groups/:groupId/transfer-ownership
 * Body: { newOwnerId }
 */
export const transferOwnership = async (req, res) => {
    try {
        const group = req.group || await Group.findById(req.params.groupId);
        const userId = req.user._id;
        const { newOwnerId } = req.body;

        if (!group || !group.isActive) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        const creatorId = (group.creator?._id || group.creator)?.toString();
        if (creatorId !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only the owner can transfer ownership" });
        }

        if (!group.isMember(newOwnerId)) {
            return res.status(400).json({ success: false, message: "New owner must be a group member" });
        }
        if (newOwnerId === creatorId) {
            return res.status(400).json({ success: false, message: "You are already the owner" });
        }

        // Update creator
        group.creator = newOwnerId;
        // Ensure new owner is admin
        if (!group.admins.some((a) => (a._id || a).toString() === newOwnerId)) {
            group.admins.push(newOwnerId);
        }
        // Make old owner a regular admin
        const oldOwnerMember = group.members.find(
            (m) => (m.user?._id || m.user).toString() === userId.toString()
        );
        if (oldOwnerMember) oldOwnerMember.role = "admin";
        // Promote new owner member entry
        const newOwnerMember = group.members.find(
            (m) => (m.user?._id || m.user).toString() === newOwnerId.toString()
        );
        if (newOwnerMember) newOwnerMember.role = "admin";

        await group.save();

        const newOwnerUser = await User.findById(newOwnerId).select("name");
        await logActivity(group._id, userId, GROUP_ACTIONS.OWNERSHIP_TRANSFERRED, newOwnerId, {
            newOwnerName: newOwnerUser?.name,
        }, req.app.get("io"));
        emit(req, `group-${group._id}`, "group:ownershipTransferred", {
            groupId: group._id,
            newOwnerId,
        });

        res.status(200).json({ success: true, message: "Ownership transferred successfully" });
    } catch (error) {
        console.error("transferOwnership error:", error);
        res.status(500).json({ success: false, message: "Error transferring ownership" });
    }
};

/* ──────────────────────────────────────────────────────────
   INVITES (formal flow)
   ────────────────────────────────────────────────────────── */

/**
 * POST /api/groups/:groupId/invites
 * Body: { userId } or { email }
 */
export const sendInvite = async (req, res) => {
    try {
        const group = req.group || await Group.findById(req.params.groupId);
        const inviterId = req.user._id;

        if (!group || !group.isActive) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }
        if (!group.isAdmin(inviterId)) {
            return res.status(403).json({ success: false, message: "Only admins/owners can send invites" });
        }

        let inviteeUser;
        const { userId, email } = req.body;

        if (userId) {
            inviteeUser = await User.findById(userId).select("name email");
        } else if (email) {
            inviteeUser = await User.findOne({ email: email.toLowerCase().trim() }).select("name email");
        }

        if (!inviteeUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (inviteeUser._id.toString() === inviterId.toString()) {
            return res.status(400).json({ success: false, message: "Cannot invite yourself" });
        }

        if (group.isMember(inviteeUser._id)) {
            return res.status(400).json({ success: false, message: "User is already a member" });
        }

        const maxMembers = group.settings?.maxMembers || 50;
        if (group.members.length >= maxMembers) {
            return res.status(400).json({ success: false, message: "Group is full" });
        }

        // Duplicate invite check
        const existing = await GroupInvite.findOne({
            group: group._id,
            invitee: inviteeUser._id,
            status: "pending",
        });
        if (existing) {
            return res.status(400).json({ success: false, message: "A pending invite already exists for this user" });
        }

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const invite = await GroupInvite.create({
            group: group._id,
            invitedBy: inviterId,
            invitee: inviteeUser._id,
            expiresAt,
        });

        await invite.populate("invitedBy", "name email");
        await invite.populate("invitee", "name email");

        // Notify invitee
        await createNotification({
            userId: inviteeUser._id,
            type: "general",
            title: `Group Invite: ${group.name}`,
            message: `${req.user.name} invited you to join "${group.name}"`,
            relatedId: group._id,
            relatedModel: "Group",
        });

        await logActivity(group._id, inviterId, GROUP_ACTIONS.INVITE_SENT, inviteeUser._id, {
            inviteeName: inviteeUser.name,
        }, req.app.get("io"));

        const io = req.app.get("io");
        if (io) {
            io.to(inviteeUser._id.toString()).emit("group:inviteReceived", {
                invite,
                groupName: group.name,
            });
            io.to(`group-${group._id}`).emit("group:inviteSent", { invite });
        }

        res.status(201).json({ success: true, message: "Invite sent", data: invite });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "A pending invite already exists for this user" });
        }
        console.error("sendInvite error:", error);
        res.status(500).json({ success: false, message: "Error sending invite" });
    }
};

/**
 * GET /api/groups/:groupId/invites    (admin/owner only)
 */
export const listGroupInvites = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);
        const userId = req.user._id;

        if (!group || !group.isActive) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }
        if (!group.isAdmin(userId)) {
            return res.status(403).json({ success: false, message: "Only admins can view invites" });
        }

        const invites = await GroupInvite.find({ group: groupId, status: "pending" })
            .populate("invitedBy", "name email profilePicture")
            .populate("invitee", "name email profilePicture")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: invites });
    } catch (error) {
        console.error("listGroupInvites error:", error);
        res.status(500).json({ success: false, message: "Error fetching invites" });
    }
};

/**
 * GET /api/groups/invites/me    — current user's pending invites
 */
export const myInvites = async (req, res) => {
    try {
        const invites = await GroupInvite.find({
            invitee: req.user._id,
            status: "pending",
            expiresAt: { $gt: new Date() },
        })
            .populate("group", "name description subject")
            .populate("invitedBy", "name email profilePicture")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: invites });
    } catch (error) {
        console.error("myInvites error:", error);
        res.status(500).json({ success: false, message: "Error fetching your invites" });
    }
};

/**
 * PATCH /api/groups/invites/:inviteId/accept    (invitee only)
 */
export const acceptInvite = async (req, res) => {
    try {
        const invite = await GroupInvite.findById(req.params.inviteId).populate("group");
        const userId = req.user._id;

        if (!invite) {
            return res.status(404).json({ success: false, message: "Invite not found" });
        }
        if (invite.invitee.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "This invite is not for you" });
        }
        if (invite.status !== "pending") {
            return res.status(400).json({ success: false, message: `Invite is already ${invite.status}` });
        }
        if (invite.expiresAt < new Date()) {
            invite.status = "expired";
            await invite.save();
            return res.status(400).json({ success: false, message: "Invite has expired" });
        }

        const group = invite.group;
        if (!group || !group.isActive) {
            return res.status(404).json({ success: false, message: "Group no longer exists" });
        }

        if (group.isMember(userId)) {
            invite.status = "accepted";
            await invite.save();
            return res.status(200).json({ success: true, message: "You are already a member" });
        }

        const maxMembers = group.settings?.maxMembers || 50;
        if (group.members.length >= maxMembers) {
            return res.status(400).json({ success: false, message: "Group is full" });
        }

        group.addMember(userId);
        await group.save();

        invite.status = "accepted";
        await invite.save();

        await logActivity(group._id, userId, GROUP_ACTIONS.INVITE_ACCEPTED, userId, {
            name: req.user.name,
        }, req.app.get("io"));

        const io = req.app.get("io");
        if (io) {
            io.to(`group-${group._id}`).emit("group:memberJoined", { groupId: group._id, userId });
            io.to(invite.invitedBy.toString()).emit("group:inviteAccepted", {
                groupId: group._id,
                groupName: group.name,
                userName: req.user.name,
            });
        }

        res.status(200).json({ success: true, message: "Invite accepted! You are now a member.", data: { groupId: group._id } });
    } catch (error) {
        console.error("acceptInvite error:", error);
        res.status(500).json({ success: false, message: "Error accepting invite" });
    }
};

/**
 * PATCH /api/groups/invites/:inviteId/decline    (invitee only)
 */
export const declineInvite = async (req, res) => {
    try {
        const invite = await GroupInvite.findById(req.params.inviteId);
        const userId = req.user._id;

        if (!invite) {
            return res.status(404).json({ success: false, message: "Invite not found" });
        }
        if (invite.invitee.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "This invite is not for you" });
        }
        if (invite.status !== "pending") {
            return res.status(400).json({ success: false, message: `Invite is already ${invite.status}` });
        }

        invite.status = "declined";
        await invite.save();

        await logActivity(invite.group, userId, GROUP_ACTIONS.INVITE_DECLINED, userId, {
            name: req.user.name,
        }, req.app.get("io"));

        res.status(200).json({ success: true, message: "Invite declined" });
    } catch (error) {
        console.error("declineInvite error:", error);
        res.status(500).json({ success: false, message: "Error declining invite" });
    }
};

/**
 * PATCH /api/groups/:groupId/invites/:inviteId/revoke    (admin/owner only)
 */
export const revokeInvite = async (req, res) => {
    try {
        const { groupId, inviteId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group || !group.isActive) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }
        if (!group.isAdmin(userId)) {
            return res.status(403).json({ success: false, message: "Only admins can revoke invites" });
        }

        const invite = await GroupInvite.findOne({ _id: inviteId, group: groupId });
        if (!invite) {
            return res.status(404).json({ success: false, message: "Invite not found" });
        }
        if (invite.status !== "pending") {
            return res.status(400).json({ success: false, message: `Invite is already ${invite.status}` });
        }

        invite.status = "revoked";
        await invite.save();

        await logActivity(group._id, userId, GROUP_ACTIONS.INVITE_REVOKED, invite.invitee, {
            inviteId: invite._id,
        }, req.app.get("io"));

        res.status(200).json({ success: true, message: "Invite revoked" });
    } catch (error) {
        console.error("revokeInvite error:", error);
        res.status(500).json({ success: false, message: "Error revoking invite" });
    }
};

/* ──────────────────────────────────────────────────────────
   ACTIVITY LOG
   ────────────────────────────────────────────────────────── */

/**
 * GET /api/groups/:groupId/activity?page=1&limit=20
 * Returns latest activity entries for a group (members only)
 */
export const getGroupActivity = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group || !group.isActive) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }
        if (!group.isMember(userId)) {
            return res.status(403).json({ success: false, message: "Members only" });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [activities, total] = await Promise.all([
            GroupActivity.find({ group: groupId })
                .populate("actor", "name email profilePicture")
                .populate("target", "name email profilePicture")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            GroupActivity.countDocuments({ group: groupId }),
        ]);

        res.status(200).json({
            success: true,
            data: activities,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("getGroupActivity error:", error);
        res.status(500).json({ success: false, message: "Error fetching activity" });
    }
};
