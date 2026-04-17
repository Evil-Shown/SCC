import mongoose from "mongoose";

export const SessionTypes = {
  LECTURE: "LECTURE",
  LAB: "LAB"
};

export const BatchTypes = {
  WEEKDAY: "WEEKDAY",
  WEEKEND: "WEEKEND",
  BOTH: "BOTH"
};

export const RoomTypes = {
  LECTURE_HALL: "LECTURE_HALL",
  LAB: "LAB"
};

const moduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, "Module name is required"],
      trim: true,
      maxlength: 200
    },
    code: {
      type: String,
      required: [true, "Module code is required"],
      trim: true,
      uppercase: true,
      maxlength: 40
    },
    sessionType: {
      type: String,
      enum: Object.values(SessionTypes),
      required: true
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 30,
      max: 480
    },
    requiredRoomType: {
      type: String,
      enum: Object.values(RoomTypes),
      required: true
    },
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
      index: true
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      index: true
    },
    batchType: {
      type: String,
      enum: Object.values(BatchTypes),
      required: true,
      index: true
    },
    sessionsPerWeek: {
      type: Number,
      min: 1,
      max: 20,
      default: 1
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

moduleSchema.index({ user: 1, code: 1, sessionType: 1 }, { unique: true });
moduleSchema.index({ user: 1, year: 1, semester: 1, batchType: 1 });

const Module = mongoose.model("Module", moduleSchema);

export default Module;
