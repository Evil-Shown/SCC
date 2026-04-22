import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: false // Optional, can be null if it's a general material
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Quiz', 'Flashcards', 'Summary', 'MindMap'],
        required: true
    },
    content: {
        type: mongoose.Schema.Types.Mixed, // JSON object ගබඩා කිරීමට (AI response එක)
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('StudyMaterial', studyMaterialSchema);
