import mongoose from "mongoose";

/**
 * Supported action types for the group activity log.
 */
export const GROUP_ACTIONS = {
    GROUP_CREATED: "group_created",
    GROUP_UPDATED: "group_updated",
    GROUP_DELETED: "group_deleted",
    MEMBER_JOINED: "member_joined",
    MEMBER_LEFT: "member_left",
    MEMBER_INVITED: "member_invited",
    MEMBER_REMOVED: "member_removed",
    INVITE_SENT: "invite_sent",
    INVITE_ACCEPTED: "invite_accepted",
    INVITE_DECLINED: "invite_declined",
    INVITE_REVOKED: "invite_revoked",
    ROLE_PROMOTED: "role_promoted",
    ROLE_DEMOTED: "role_demoted",
    OWNERSHIP_TRANSFERRED: "ownership_transferred",
};

const groupActivitySchema = new mongoose.Schema(
    {
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
            index: true,
        },
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String,
            enum: Object.values(GROUP_ACTIONS),
            required: true,
        },
        // Optional: the user who was affected (e.g., the member who was removed)
        target: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        // Arbitrary metadata snapshot (name, role change, etc.)
        meta: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
        // Keep only latest 500 per group — managed in code, not TTL, for flexibility
    }
);

// Fetch recent activities for a group efficiently
groupActivitySchema.index({ group: 1, createdAt: -1 });

const GroupActivity = mongoose.model("GroupActivity", groupActivitySchema);

export default GroupActivity;
