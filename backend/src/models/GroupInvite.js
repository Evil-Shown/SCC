import mongoose from "mongoose";

const groupInviteSchema = new mongoose.Schema(
    {
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
            index: true,
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        invitee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "declined", "expired", "revoked"],
            default: "pending",
            index: true,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            index: { expireAfterSeconds: 0 }, // TTL — auto-delete expired docs
        },
    },
    { timestamps: true }
);

// Compound index: one active invite per (group, invitee) pair
groupInviteSchema.index(
    { group: 1, invitee: 1 },
    { unique: true, partialFilterExpression: { status: "pending" } }
);

const GroupInvite = mongoose.model("GroupInvite", groupInviteSchema);

export default GroupInvite;
