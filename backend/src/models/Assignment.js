import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"]
    },
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        maxlength: [200, "Title cannot exceed 200 characters"]
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    subject: {
        type: String,
        required: [true, "Subject is required"],
        trim: true
    },
    dueDate: {
        type: Date,
        required: [true, "Due date is required"]
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    status: {
        type: String,
        enum: ["pending", "in_progress", "completed", "overdue"],
        default: "pending"
    },
    attachmentLink: {
        type: String,
        trim: true,
        default: ""
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        default: null
    }
}, {
    timestamps: true
});

assignmentSchema.index({ userId: 1, dueDate: 1 });
assignmentSchema.index({ userId: 1, status: 1 });

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
