import mongoose from "mongoose";

const labelSnapshotSchema = new mongoose.Schema(
  {
    moduleCode: { type: String, default: "" },
    moduleName: { type: String, default: "" },
    sessionType: { type: String, default: "" },
    resourceName: { type: String, default: "" },
    resourceType: { type: String, default: "" },
    resourceLocation: { type: String, default: "" }
  },
  { _id: false }
);

const timetableSlotSchema = new mongoose.Schema(
  {
    timetable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SemesterTimetable",
      required: true,
      index: true
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
      index: true
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
      index: true
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
      index: true
    },
    startMinute: {
      type: Number,
      required: true,
      min: 0,
      max: 24 * 60,
      index: true
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 30,
      max: 480
    },
    labelSnapshot: {
      type: labelSnapshotSchema,
      default: () => ({})
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

timetableSlotSchema.index({ timetable: 1, dayOfWeek: 1, startMinute: 1 });
timetableSlotSchema.index({ timetable: 1, resource: 1, dayOfWeek: 1, startMinute: 1 });

// Keep denormalized snapshots in sync when possible.
timetableSlotSchema.pre("validate", function () {
  if (this.startMinute == null || this.durationMinutes == null) return;
  const endMinute = Number(this.startMinute) + Number(this.durationMinutes);
  if (Number.isFinite(endMinute) && endMinute > 24 * 60) {
    this.invalidate("durationMinutes", "Slot cannot extend beyond 24:00");
  }
});

const TimetableSlot = mongoose.model("TimetableSlot", timetableSlotSchema);

export default TimetableSlot;
