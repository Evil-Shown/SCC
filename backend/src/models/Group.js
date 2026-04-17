import mongoose from "mongoose";

// This is the main schema for our study groups
const groupSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // The person who made the group
        admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // List of people who can manage the group
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
        isPublic: { type: Boolean, default: true }, // Can everyone see it or just invited people?
        isActive: { type: Boolean, default: true }, // For soft delete
        settings: {
            isPublic: { type: Boolean, default: true },
            allowMemberInvites: { type: Boolean, default: true },
            maxMembers: { type: Number, default: 50 },
        },
    },
    { timestamps: true }
);

// Helper to see if a user is already in the group
groupSchema.methods.isMember = function (userId) {
    const id = userId?.toString();
    return this.members.some(
        (m) => (m.user?._id || m.user)?.toString() === id
    );
};

// Check if user has admin rights (owner or admin role)
groupSchema.methods.isAdmin = function (userId) {
    const id = userId?.toString();
    return (
        (this.creator?._id || this.creator)?.toString() === id ||
        this.admins.some((a) => (a?._id || a)?.toString() === id) ||
        this.members.some((m) => (m.user?._id || m.user)?.toString() === id && m.role === "admin")
    );
};

// Adding a new person to the members list
groupSchema.methods.addMember = function (userId, role = "member") {
    if (!this.isMember(userId)) {
        this.members.push({ user: userId, role, joinedAt: new Date() });
    }
};

// Removing someone from the group
groupSchema.methods.removeMember = function (userId) {
    const id = userId?.toString();
    this.members = this.members.filter(
        (m) => (m.user?._id || m.user)?.toString() !== id
    );
};

const Group = mongoose.model("Group", groupSchema);

export default Group;
