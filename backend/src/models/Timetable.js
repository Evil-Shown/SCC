import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"]
    },
    subject: {
        type: String,
        required: [true, "Subject is required"],
        trim: true
    },
    dayOfWeek: {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        required: [true, "Day of week is required"]
    },
    startTime: {
        type: String,
        required: [true, "Start time is required"],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"]
    },
    endTime: {
        type: String,
        required: [true, "End time is required"],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"]
    },
    location: {
        type: String,
        trim: true,
        default: ""
    },
    lecturer: {
        type: String,
        trim: true,
        default: ""
    },
    type: {
        type: String,
        enum: ["lecture", "lab", "tutorial", "other"],
        default: "lecture"
    },
    color: {
        type: String,
        default: "#4F46E5"
    }
}, {
    timestamps: true
});

timetableSchema.index({ userId: 1, dayOfWeek: 1 });

const Timetable = mongoose.model("Timetable", timetableSchema);

export default Timetable;
