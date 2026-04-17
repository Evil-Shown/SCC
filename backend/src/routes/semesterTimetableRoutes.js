import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  addTimetableSlot,
  deleteSemesterTimetable,
  deleteTimetableSlot,
  generateSemesterTimetable,
  getSemesterTimetable,
  searchSemesterTimetables,
  updateTimetableSlot
} from "../controllers/semesterTimetableController.js";

const router = express.Router();

router.use(authenticate);

/** Only lecturers (teacher) and admins may run the generator; students may still view/search their own timetables. */
router.post(
  "/semester-timetables/generate",
  authorize("teacher", "admin"),
  generateSemesterTimetable
);
router.get("/semester-timetables", searchSemesterTimetables);
router.get("/semester-timetables/:id", getSemesterTimetable);
router.delete("/semester-timetables/:id", deleteSemesterTimetable);

router.post("/semester-timetables/:id/slots", addTimetableSlot);
router.patch("/semester-timetables/:id/slots/:slotId", updateTimetableSlot);
router.delete("/semester-timetables/:id/slots/:slotId", deleteTimetableSlot);

export default router;

