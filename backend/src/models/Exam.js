import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
    student_id: { type: String, required: true }, //ID from Auth
    module_Id: { type: String, required: true },
    module_name: { type: String, required: true },
    examDate: { type: Date, required: true },
    exam_Type: { type: String, enum: ['midterm', 'final', 'repeat', 'pro_rata'], required: true },
    coverage_Topics: [{ type: String }],
    difficulty: { type: Number, default: 2 },
    dailyPlan: [{
        date: String,
        topics: [String],
        isCompleted: { type: Boolean, default: false }
    }],
    readinessScore: { type: Number, default: 0 }
});

export default mongoose.model('Exam', examSchema);