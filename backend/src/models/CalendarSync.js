import mongoose from "mongoose";

const calendarSyncSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    googleRefreshToken: {
      type: String,
      select: false
    },
    lastSyncedAt: {
      type: Date
    },
    /** Google Calendar event IDs created by SCC sync (so we can delete them later). */
    syncedGoogleEventIds: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const CalendarSync = mongoose.model("CalendarSync", calendarSyncSchema);

export default CalendarSync;

