import User from "../models/User.js";
import Group from "../models/Group.js";
import { authenticate } from "../middlewares/auth.js";

/**
 * GET /api/groups/users/search?q=name
 * Search users by name or email (for group invitations)
 */
export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;

        const query = {
            _id: { $ne: req.user._id } // never include current user
        };

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

/**
 * GET /api/groups
 * List groups — public ones + groups the user is a member of
 */
export const getGroups = async (req, res) => {
    try {
        const { search, myGroups } = req.query;
        const userId = req.user._id;

        let query = {};

        if (myGroups === "true") {
            query["members.user"] = userId;
        } else {
            query.$or = [
                { isPublic: true },
                { "members.user": userId },
            ];
        }

        if (search) {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { subject: { $regex: search, $options: "i" } },
                    { courseCode: { $regex: search, $options: "i" } },
                ],
            });
        }

        const groups = await Group.find(query)
            .populate("creator", "name email profilePicture")
            .populate("members.user", "name email profilePicture")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: groups });
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
            .populate("members.user", "name email profilePicture");

        if (!group) return res.status(404).json({ success: false, message: "Group not found" });

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
        const { name, description, subject, courseCode, tags, isPublic, allowMemberInvites, maxMembers } = req.body;
        const userId = req.user._id;

        if (!name?.trim()) return res.status(400).json({ success: false, message: "Group name is required" });

        const group = new Group({
            name: name.trim(),
            description: description?.trim() || "",
            subject: subject?.trim() || "",
            courseCode: courseCode?.trim() || "",
            tags: tags || [],
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

        const io = req.app.get("io");
        if (io) io.to(userId.toString()).emit("group:created", { group });

        res.status(201).json({ success: true, message: "Group created successfully", data: group });
    } catch (error) {
        console.error("createGroup error:", error);
        res.status(500).json({ success: false, message: "Error creating group" });
    }
};

/**
 * POST /api/groups/:groupId/join
 */
export const joinGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        const userId = req.user._id;

        if (!group) return res.status(404).json({ success: false, message: "Group not found" });
        if (!group.isPublic) return res.status(403).json({ success: false, message: "This group is private. You need an invitation." });
        if (group.isMember(userId)) return res.status(400).json({ success: false, message: "You are already a member" });

        const maxMembers = group.settings?.maxMembers || 50;
        if (group.members.length >= maxMembers) return res.status(400).json({ success: false, message: "Group is full" });

        group.addMember(userId);
        await group.save();
        await group.populate("creator", "name email profilePicture");
        await group.populate("members.user", "name email profilePicture");

        const io = req.app.get("io");
        if (io) io.to(`group-${group._id}`).emit("group:member-joined", { groupId: group._id, userId });

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

        if (!group) return res.status(404).json({ success: false, message: "Group not found" });
        if (!group.isMember(userId)) return res.status(400).json({ success: false, message: "You are not a member" });
        if (group.creator?.toString() === userId.toString()) {
            return res.status(400).json({ success: false, message: "Creator cannot leave. Transfer ownership or delete the group." });
        }

        group.removeMember(userId);
        await group.save();

        const io = req.app.get("io");
        if (io) io.to(`group-${group._id}`).emit("group:member-left", { groupId: group._id, userId });

        res.status(200).json({ success: true, message: "Successfully left group", data: { groupId: group._id } });
    } catch (error) {
        console.error("leaveGroup error:", error);
        res.status(500).json({ success: false, message: "Error leaving group" });
    }
};

/**
 * PUT /api/groups/:groupId
 */
export const updateGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        const userId = req.user._id;

        if (!group) return res.status(404).json({ success: false, message: "Group not found" });
        if (!group.isAdmin(userId)) return res.status(403).json({ success: false, message: "Only admins can update the group" });

        const { name, description, subject, courseCode, tags, isPublic } = req.body;
        if (name) group.name = name.trim();
        if (description !== undefined) group.description = description;
        if (subject !== undefined) group.subject = subject;
        if (courseCode !== undefined) group.courseCode = courseCode;
        if (tags !== undefined) group.tags = tags;
        if (isPublic !== undefined) { group.isPublic = isPublic; group.settings.isPublic = isPublic; }

        await group.save();
        await group.populate("creator", "name email profilePicture");
        await group.populate("members.user", "name email profilePicture");

        res.status(200).json({ success: true, message: "Group updated", data: group });
    } catch (error) {
        console.error("updateGroup error:", error);
        res.status(500).json({ success: false, message: "Error updating group" });
    }
};

/**
 * DELETE /api/groups/:groupId
 */
export const deleteGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        const userId = req.user._id;

        if (!group) return res.status(404).json({ success: false, message: "Group not found" });
        if (group.creator?.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only the group creator can delete it" });
        }

        await Group.findByIdAndDelete(req.params.groupId);

        const io = req.app.get("io");
        if (io) io.to(`group-${group._id}`).emit("group:deleted", { groupId: group._id });

        res.status(200).json({ success: true, message: "Group deleted successfully" });
    } catch (error) {
        console.error("deleteGroup error:", error);
        res.status(500).json({ success: false, message: "Error deleting group" });
    }
};

/**
 * POST /api/groups/:groupId/invite
 * Leader/admin sends invitation → real-time notification to invited user
 */
export const inviteMember = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId)
            .populate("members.user", "name email")
            .populate("creator", "name");
        const inviterId = req.user._id;
        const { userId: invitedUserId } = req.body;

        if (!group) return res.status(404).json({ success: false, message: "Group not found" });
        if (!group.isAdmin(inviterId)) return res.status(403).json({ success: false, message: "Only admins/leaders can send invitations" });
        if (group.isMember(invitedUserId)) return res.status(400).json({ success: false, message: "User is already a member" });

        const maxMembers = group.settings?.maxMembers || 50;
        if (group.members.length >= maxMembers) return res.status(400).json({ success: false, message: "Group is full" });

        // Add the user directly (invitation accepted immediately model)
        group.addMember(invitedUserId);
        await group.save();
        await group.populate("members.user", "name email profilePicture");

        // Create persisted notification for invited user
        const { createNotification } = await import("../services/notificationService.js");
        const notification = await createNotification({
            userId: invitedUserId,
            type: "general",
            title: `Invited to group: ${group.name}`,
            message: `You have been added to the group "${group.name}" by ${req.user.name}`,
            relatedId: group._id,
            relatedModel: "Group",
        });

        // Real-time push to invited user's personal room
        const io = req.app.get("io");
        if (io) {
            io.to(invitedUserId.toString()).emit("notification:new", notification);
            io.to(`group-${group._id}`).emit("group:member-added", { groupId: group._id, userId: invitedUserId });
        }

        res.status(200).json({ success: true, message: "User invited and added to group", data: group });
    } catch (error) {
        console.error("inviteMember error:", error);
        res.status(500).json({ success: false, message: "Error inviting member" });
    }
};

/**
 * POST /api/groups/:groupId/members
 * Add a member (admin only)
 */
export const addMember = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        const userId = req.user._id;
        const { userId: targetUserId } = req.body;

        if (!group) return res.status(404).json({ success: false, message: "Group not found" });
        if (!group.isAdmin(userId)) return res.status(403).json({ success: false, message: "Only admins can add members" });
        if (group.isMember(targetUserId)) return res.status(400).json({ success: false, message: "User is already a member" });

        group.addMember(targetUserId);
        await group.save();
        await group.populate("members.user", "name email profilePicture");

        res.status(200).json({ success: true, message: "Member added", data: group });
    } catch (error) {
        console.error("addMember error:", error);
        res.status(500).json({ success: false, message: "Error adding member" });
    }
};

/**
 * DELETE /api/groups/:groupId/members/:memberId
 */
export const removeMemberController = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        const userId = req.user._id;
        const { memberId } = req.params;

        if (!group) return res.status(404).json({ success: false, message: "Group not found" });
        if (!group.isAdmin(userId)) return res.status(403).json({ success: false, message: "Only admins can remove members" });
        if (memberId === group.creator?.toString()) return res.status(400).json({ success: false, message: "Cannot remove the group creator" });

        group.removeMember(memberId);
        await group.save();

        const io = req.app.get("io");
        if (io) io.to(`group-${group._id}`).emit("group:member-removed", { groupId: group._id, memberId });

        res.status(200).json({ success: true, message: "Member removed", data: { memberId } });
    } catch (error) {
        console.error("removeMember error:", error);
        res.status(500).json({ success: false, message: "Error removing member" });
    }
};
