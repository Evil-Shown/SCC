import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"]
  },
  type: {
    type: String,
    enum: [
      // Existing types
      "kuppi_scheduled",
      "note_reaction",
      "note_comment",
      "general",
      // Group meetup types
      "group_meetup_created",
      "group_meetup_activated",
      "group_meetup_confirmed",
      "group_meetup_cancelled",
      "group_meetup_completed",
      "group_meetup_vote",
    ],
    required: [true, "Notification type is required"]
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "relatedModel"
  },
  relatedModel: {
    type: String,
    enum: ["Note", "KuppiPost", "Comment", "Reaction", "Meeting", "Group"]
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
