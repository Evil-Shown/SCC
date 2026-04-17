import mongoose from "mongoose";

export const SemesterTimetableBatchTypes = {
  WEEKDAY: "WEEKDAY",
  WEEKEND: "WEEKEND"
};

export const SemesterTimetableStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED"
};

const generationConfigSchema = new mongoose.Schema(
  {
    dayStartMinutes: { type: Number, default: 8 * 60, min: 0, max: 24 * 60 },
    dayEndMinutes: { type: Number, default: 18 * 60, min: 0, max: 24 * 60 },
    slotStepMinutes: { type: Number, default: 30, min: 5, max: 240 },
    days: { type: Number, default: 5, min: 1, max: 7 }
  },
  { _id: false }
);

const semesterTimetableSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
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
      enum: Object.values(SemesterTimetableBatchTypes),
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(SemesterTimetableStatus),
      default: SemesterTimetableStatus.DRAFT
    },
    generationConfig: {
      type: generationConfigSchema,
      default: () => ({})
    },
    metrics: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

semesterTimetableSchema.index(
  { user: 1, year: 1, semester: 1, batchType: 1 },
  { unique: true }
);

const SemesterTimetable = mongoose.model("SemesterTimetable", semesterTimetableSchema);

export default SemesterTimetable;
