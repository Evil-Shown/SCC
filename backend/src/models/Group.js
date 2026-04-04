import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        members: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                role: { type: String, enum: ["admin", "member"], default: "member" },
                joinedAt: { type: Date, default: Date.now },
            },
        ],
        subject: { type: String, default: "" },
        courseCode: { type: String, default: "" },
        tags: [{ type: String }],
        isPublic: { type: Boolean, default: true },
        isActive: { type: Boolean, default: true },
        settings: {
            isPublic: { type: Boolean, default: true },
            allowMemberInvites: { type: Boolean, default: true },
            maxMembers: { type: Number, default: 50 },
        },
    },
    { timestamps: true }
);

// Check if a user is a member of this group
groupSchema.methods.isMember = function (userId) {
    const id = userId?.toString();
    return this.members.some(
        (m) => (m.user?._id || m.user)?.toString() === id
    );
};

// Check if a user is an admin of this group
groupSchema.methods.isAdmin = function (userId) {
    const id = userId?.toString();
    return (
        (this.creator?._id || this.creator)?.toString() === id ||
        this.admins.some((a) => (a?._id || a)?.toString() === id) ||
        this.members.some((m) => (m.user?._id || m.user)?.toString() === id && m.role === "admin")
    );
};

// Add a member to this group
groupSchema.methods.addMember = function (userId, role = "member") {
    if (!this.isMember(userId)) {
        this.members.push({ user: userId, role, joinedAt: new Date() });
    }
};

// Remove a member from this group
groupSchema.methods.removeMember = function (userId) {
    const id = userId?.toString();
    this.members = this.members.filter(
        (m) => (m.user?._id || m.user)?.toString() !== id
    );
};

const Group = mongoose.model("Group", groupSchema);

export default Group;
