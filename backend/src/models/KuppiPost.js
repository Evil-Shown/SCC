import mongoose from "mongoose";

const kuppiPostSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Owner ID is required"]
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
  eventDate: {
    type: Date,
    required: [true, "Event date is required"]
  },
  meetingLink: {
    type: String,
    trim: true,
    default: ""
  },
  applicantsCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["pending", "scheduled", "completed", "cancelled"],
    default: "pending"
  }
}, {
  timestamps: true
});

kuppiPostSchema.index({ eventDate: 1 });
kuppiPostSchema.index({ ownerId: 1 });
kuppiPostSchema.index({ createdAt: -1 });

const KuppiPost = mongoose.model("KuppiPost", kuppiPostSchema);

export default KuppiPost;
