import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
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
    required: [true, "Description is required"],
    trim: true
  },
  onedriveLink: {
    type: String,
    trim: true,
    default: ""
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  subject: {
    type: String,
    trim: true,
    default: ""
  },
  year: {
    type: Number,
    min: [1, "Year must be at least 1"],
    max: [6, "Year cannot exceed 6"],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  reactionsCount: {
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 }
  },
  commentsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search optimization
noteSchema.index({ title: "text", description: "text", tags: "text" });
noteSchema.index({ createdAt: -1 });
noteSchema.index({ userId: 1 });

const Note = mongoose.model("Note", noteSchema);

export default Note;
