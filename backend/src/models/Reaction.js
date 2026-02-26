import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ["like", "dislike"],
    required: [true, "Reaction type is required"]
  }
}, {
  timestamps: true
});

// Ensure a user can only have one reaction per note
reactionSchema.index({ userId: 1, noteId: 1 }, { unique: true });
reactionSchema.index({ noteId: 1 });

const Reaction = mongoose.model("Reaction", reactionSchema);

export default Reaction;
