import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Organizer ID is required"]
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
    meetingDate: {
        type: Date,
        required: [true, "Meeting date is required"]
    },
    duration: {
        type: Number, // in minutes
        default: 60,
        min: [1, "Duration must be at least 1 minute"]
    },
    meetingLink: {
        type: String,
        trim: true,
        default: ""
    },
    location: {
        type: String,
        trim: true,
        default: ""
    },
    type: {
        type: String,
        enum: ["online", "physical", "hybrid"],
        default: "online"
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        default: null
    },
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    status: {
        type: String,
        enum: ["scheduled", "ongoing", "completed", "cancelled"],
        default: "scheduled"
    }
}, {
    timestamps: true
});

meetingSchema.index({ organizerId: 1, meetingDate: 1 });
meetingSchema.index({ groupId: 1 });

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;
