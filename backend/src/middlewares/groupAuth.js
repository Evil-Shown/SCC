import Group from "../models/Group.js";

/**
 * Middleware factory that verifies the authenticated user holds
 * at least one of the required roles in the group specified by
 * req.params.groupId.
 *
 * Usage:
 *   router.delete("/:groupId", authenticate, requireGroupRole("owner"), deleteGroup);
 *   router.put("/:groupId",    authenticate, requireGroupRole("admin", "owner"), updateGroup);
 *
 * Roles (most → least privileged):
 *   "owner"  — the group.creator
 *   "admin"  — in group.admins array
 *   "member" — any member
 *
 * Attaches req.group after a successful check to avoid a second DB lookup
 * in the actual handler.
 */
export const requireGroupRole = (...roles) => {
    return async (req, res, next) => {
        try {
            const { groupId } = req.params;

            if (!groupId) {
                return res.status(400).json({ success: false, message: "Group ID is required" });
            }

            const group = await Group.findById(groupId)
                .populate("creator", "name email profilePicture")
                .populate("members.user", "name email profilePicture")
                .populate("admins", "name email");

            if (!group || !group.isActive) {
                return res.status(404).json({ success: false, message: "Group not found" });
            }

            const userId = req.user._id.toString();
            const creatorId = (group.creator?._id || group.creator)?.toString();
            const isOwner = creatorId === userId;
            const isAdmin =
                isOwner ||
                group.admins.some((a) => (a._id || a).toString() === userId) ||
                group.members.some(
                    (m) => (m.user?._id || m.user).toString() === userId && m.role === "admin"
                );
            const isMember =
                isAdmin ||
                group.members.some((m) => (m.user?._id || m.user).toString() === userId);

            const permitted = roles.every((r) => {
                if (r === "owner") return isOwner;
                if (r === "admin") return isAdmin;
                if (r === "member") return isMember;
                return false;
            });

            if (!permitted) {
                const roleStr = roles.join(" or ");
                return res.status(403).json({
                    success: false,
                    message: `Permission denied. Requires ${roleStr} role.`,
                });
            }

            // Attach for downstream handlers
            req.group = group;
            req.isOwner = isOwner;
            req.isAdmin = isAdmin;
            req.isMember = isMember;

            next();
        } catch (error) {
            console.error("requireGroupRole error:", error);
            return res.status(500).json({ success: false, message: "Authorization check failed" });
        }
    };
};

/**
 * Lightweight middleware that just loads & attaches req.group without role checks.
 * Use this on endpoints accessible to any member.
 */
export const loadGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId)
            .populate("creator", "name email profilePicture")
            .populate("members.user", "name email profilePicture")
            .populate("admins", "name email");

        if (!group || !group.isActive) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        const userId = req.user._id.toString();
        const creatorId = (group.creator?._id || group.creator)?.toString();
        req.isOwner = creatorId === userId;
        req.isAdmin =
            req.isOwner ||
            group.admins.some((a) => (a._id || a).toString() === userId) ||
            group.members.some(
                (m) => (m.user?._id || m.user).toString() === userId && m.role === "admin"
            );
        req.isMember =
            req.isAdmin ||
            group.members.some((m) => (m.user?._id || m.user).toString() === userId);

        req.group = group;
        next();
    } catch (error) {
        console.error("loadGroup error:", error);
        return res.status(500).json({ success: false, message: "Failed to load group" });
    }
};
