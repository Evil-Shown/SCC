import mongoose from "mongoose";

const examDailyTaskSchema = new mongoose.Schema(
    {
        date: { type: String, required: true },
        topics: { type: [String], default: [] },
        estimatedHours: { type: Number, default: 0 },
        isCompleted: { type: Boolean, default: false }
    },
    { _id: false }
);

const examSchema = new mongoose.Schema(
    {
        // Primary fields used by the current application.
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        subjectCode: { type: String, required: true, trim: true },
        subjectName: { type: String, required: true, trim: true },
        examDate: { type: Date, required: true },
        examType: {
            type: String,
            enum: ["midterm", "final", "repeat", "pro_rata", "lab", "viva", "other"],
            default: "final"
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium"
        },
        coverageTopics: { type: [String], default: [] },
        totalTopics: { type: Number, default: 0, min: 0 },
        completedTopics: { type: Number, default: 0, min: 0 },
        readinessScore: { type: Number, default: 0, min: 0, max: 100 },
        dailyPlan: { type: [examDailyTaskSchema], default: [] },
        status: {
            type: String,
            enum: ["scheduled", "completed", "cancelled"],
            default: "scheduled"
        },

        // Legacy compatibility fields retained for existing flows.
        student_id: { type: String, default: "" },
        module_Id: { type: String, default: "" },
        module_name: { type: String, default: "" },
        exam_Type: { type: String, default: "" },
        coverage_Topics: { type: [String], default: [] }
    },
    { timestamps: true }
);

examSchema.pre("save", function syncLegacyFields(next) {
    // Keep compatibility with old frontend payload keys.
    this.module_Id = this.subjectCode || this.module_Id;
    this.module_name = this.subjectName || this.module_name;
    this.exam_Type = this.examType || this.exam_Type;
    this.coverage_Topics = this.coverageTopics || this.coverage_Topics;
    next();
});

export default mongoose.model("Exam", examSchema);