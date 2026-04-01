import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        response: {
            type: String,
            enum: ["YES", "NO"],
            required: true,
        },
        votedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const meetingSchema = new mongoose.Schema(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: [true, "Group ID is required"],
        },
        organizerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Organizer ID is required"],
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [150, "Title cannot exceed 150 characters"],
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        meetingDate: {
            type: Date,
            required: [true, "Meeting date is required"],
        },
        time: {
            type: String,
            required: [true, "Meeting time is required"],
        },
        duration: {
            type: Number,
            default: 60,
            min: [1, "Duration must be at least 1 minute"],
        },
        mode: {
            type: String,
            enum: ["ONLINE", "PHYSICAL", "HYBRID"],
            required: [true, "Meeting mode is required"],
        },
        meetingLink: {
            type: String,
            trim: true,
            default: "",
        },
        location: {
            type: String,
            trim: true,
            default: "",
        },
        minConfirmations: {
            type: Number,
            required: [true, "Minimum confirmations is required"],
            min: [1, "Minimum confirmations must be at least 1"],
        },
        status: {
            type: String,
            enum: ["Draft", "Active", "Confirmed", "Cancelled", "Completed"],
            default: "Draft",
        },
        votes: [voteSchema],
        attendanceSynced: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

meetingSchema.virtual("yesCount").get(function () {
    return this.votes.filter((v) => v.response === "YES").length;
});

meetingSchema.virtual("noCount").get(function () {
    return this.votes.filter((v) => v.response === "NO").length;
});

meetingSchema.index({ groupId: 1, meetingDate: 1 });
meetingSchema.index({ status: 1 });

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;
