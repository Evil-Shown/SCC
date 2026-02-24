import mongoose from "mongoose";

const kuppiApplicantSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "KuppiPost",
    required: [true, "Post ID is required"]
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Applicant ID is required"]
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  notificationSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure a user can only apply once per kuppi post
kuppiApplicantSchema.index({ postId: 1, applicantId: 1 }, { unique: true });
kuppiApplicantSchema.index({ postId: 1 });

const KuppiApplicant = mongoose.model("KuppiApplicant", kuppiApplicantSchema);

export default KuppiApplicant;
