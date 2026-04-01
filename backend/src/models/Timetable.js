import mongoose from "mongoose";

// Timetable model shape expected by:
// - `backend/src/controllers/timetableController.js`
// - `frontend/src/pages/Timetable.jsx`
//
// The app stores a single timetable document per user with:
// - `universitySchedule`: base events (user-provided)
// - `optimizedSchedule`: AI/rule-based added study sessions
//
// Each event uses `start`/`end` datetimes (ISO strings cast to Date by Mongoose).

const timetableEventSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    subjectCode: { type: String, default: "" },
    type: { type: String, default: "lecture" }, // lecture | lab | tutorial | exam | study | other
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    location: { type: String, default: "" },
    metadata: { type: Object, default: {} }
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    universitySchedule: { type: [timetableEventSchema], default: [] },
    optimizedSchedule: { type: [timetableEventSchema], default: [] }
  },
  {
    timestamps: true
  }
);

// Allow multiple historical timetables; controllers use `sort({ createdAt: -1 })`
// to pick the latest one.
timetableSchema.index({ user: 1 });

const Timetable = mongoose.model("Timetable", timetableSchema);

export default Timetable;
