import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"]
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note",
    required: [true, "Note ID is required"]
  },
  commentText: {
    type: String,
    required: [true, "Comment text is required"],
    trim: true,
    maxlength: [1000, "Comment cannot exceed 1000 characters"]
  }
}, {
  timestamps: true
});

commentSchema.index({ noteId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
