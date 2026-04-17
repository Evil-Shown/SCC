import SemesterTimetable, {
  SemesterTimetableBatchTypes
} from "../models/SemesterTimetable.js";
import TimetableSlot from "../models/TimetableSlot.js";
import Resource from "../models/Resource.js";
import Module, { BatchTypes } from "../models/Module.js";
import { generateSemesterTimetableSlots, materializeSlotsToEvents } from "../utils/timetableGenerator.js";

function parsePositiveInt(value, fallback = null) {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return fallback;
  return n;
}

function normalizeBatchType(value) {
  if (!value) return null;
  const s = String(value).trim().toUpperCase();
  if (s === "WEEKDAY") return "WEEKDAY";
  if (s === "WEEKEND") return "WEEKEND";
  if (s === "BOTH") return "BOTH";
  return null;
}

export const generateSemesterTimetable = async (req, res) => {
  try {
    const year = parsePositiveInt(req.body?.year);
    const semester = parsePositiveInt(req.body?.semester);
    const batchType = normalizeBatchType(req.body?.batchType);
    const config = req.body?.config || {};

    if (!year || !semester || !batchType) {
      return res.status(400).json({ success: false, message: "year, semester, batchType are required" });
    }

    const resources = await Resource.find({ user: req.user._id });

    const moduleFilter = {
      user: req.user._id,
      year,
      semester
    };

    const allModules = await Module.find(moduleFilter);

    const buildFor = async (bt) => {
      const timetable = await SemesterTimetable.findOneAndUpdate(
        { user: req.user._id, year, semester, batchType: bt },
        {
          $setOnInsert: { user: req.user._id, year, semester, batchType: bt },
          $set: {
            generationConfig: { ...config }
          }
        },
        { upsert: true, new: true, runValidators: true }
      );

      await TimetableSlot.deleteMany({ timetable: timetable._id });

      const modulesForThis = allModules.filter((m) => {
        const b = String(m.batchType || "").toUpperCase();
        return b === bt || b === BatchTypes.BOTH;
      });

      const otherTimetables = await SemesterTimetable.find({
        user: req.user._id,
        _id: { $ne: timetable._id }
      }).select("_id");
      const otherTimetableIds = otherTimetables.map((t) => t._id);
      const externalResourceSlots = otherTimetableIds.length > 0
        ? await TimetableSlot.find({
            timetable: { $in: otherTimetableIds },
            dayOfWeek: { $in: bt === SemesterTimetableBatchTypes.WEEKEND ? [6, 7] : [1, 2, 3, 4, 5] }
          }).select("resource dayOfWeek startMinute durationMinutes labelSnapshot timetable")
        : [];

      const otherTimetablesMeta = otherTimetableIds.length > 0
        ? await SemesterTimetable.find({
            _id: { $in: otherTimetableIds }
          }).select("_id year semester batchType").lean()
        : [];
      const otherTimetableMap = new Map(otherTimetablesMeta.map((t) => [String(t._id), t]));

      const slots = await generateSemesterTimetableSlots({
        userId: req.user._id,
        timetable,
        resources,
        modules: modulesForThis,
        externalResourceSlots
      });

      const generatedConflict = slots.find((generatedSlot) => {
        const generatedResourceId = getSlotResourceId(generatedSlot);
        if (!generatedResourceId) return false;

        return externalResourceSlots.some((existingSlot) => {
          const existingResourceId = getSlotResourceId(existingSlot);
          if (!existingResourceId || existingResourceId !== generatedResourceId) return false;
          if (Number(existingSlot.dayOfWeek) !== Number(generatedSlot.dayOfWeek)) return false;
          return slotsOverlap(
            generatedSlot.startMinute,
            generatedSlot.durationMinutes,
            existingSlot.startMinute,
            existingSlot.durationMinutes
          );
        });
      });

      if (generatedConflict) {
        const generatedResourceId = getSlotResourceId(generatedConflict);
        const conflictingExternalSlot = externalResourceSlots.find((existingSlot) => {
          const existingResourceId = getSlotResourceId(existingSlot);
          if (!existingResourceId || existingResourceId !== generatedResourceId) return false;
          if (Number(existingSlot.dayOfWeek) !== Number(generatedConflict.dayOfWeek)) return false;
          return slotsOverlap(
            generatedConflict.startMinute,
            generatedConflict.durationMinutes,
            existingSlot.startMinute,
            existingSlot.durationMinutes
          );
        });

        if (conflictingExternalSlot) {
          const conflictWithMeta = {
            ...conflictingExternalSlot,
            timetableInfo: otherTimetableMap.get(String(conflictingExternalSlot.timetable)) || null
          };
          throw Object.assign(new Error(resourceConflictMessage(conflictWithMeta)), { statusCode: 409 });
        }
      }

      const created = await TimetableSlot.insertMany(slots, { ordered: true });
      const events = materializeSlotsToEvents(created);
      return { timetable, slots: created, events };
    };

    if (batchType === "BOTH") {
      const weekday = await buildFor(SemesterTimetableBatchTypes.WEEKDAY);
      const weekend = await buildFor(SemesterTimetableBatchTypes.WEEKEND);
      return res.status(200).json({
        success: true,
        message: "Timetables generated",
        data: { weekday, weekend }
      });
    }

    const single = await buildFor(batchType);
    return res.status(200).json({
      success: true,
      message: "Timetable generated",
      data: single
    });
  } catch (error) {
    console.error("generateSemesterTimetable:", error);
    if (error?.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message || "Failed to generate timetable" });
  }
};

export const searchSemesterTimetables = async (req, res) => {
  try {
    const { year, semester, batchType } = req.query || {};
    const filter = { user: req.user._id };
    if (year != null && year !== "") filter.year = Number(year);
    if (semester != null && semester !== "") filter.semester = Number(semester);
    if (batchType) filter.batchType = String(batchType).toUpperCase();

    const timetables = await SemesterTimetable.find(filter).sort({ year: 1, semester: 1, batchType: 1 });
    return res.status(200).json({ success: true, data: timetables });
  } catch (error) {
    console.error("searchSemesterTimetables:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to search timetables" });
  }
};

export const getSemesterTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const timetable = await SemesterTimetable.findOne({ _id: id, user: req.user._id });
    if (!timetable) {
      return res.status(404).json({ success: false, message: "Timetable not found" });
    }
    const slots = await TimetableSlot.find({ timetable: id })
      .populate("module")
      .populate("resource")
      .sort({ dayOfWeek: 1, startMinute: 1 });
    return res.status(200).json({ success: true, data: { timetable, slots } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch timetable" });
  }
};

export const deleteSemesterTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const timetable = await SemesterTimetable.findOneAndDelete({ _id: id, user: req.user._id });
    if (!timetable) {
      return res.status(404).json({ success: false, message: "Timetable not found" });
    }
    const slotRes = await TimetableSlot.deleteMany({ timetable: id });
    return res.status(200).json({
      success: true,
      message: "Timetable deleted",
      data: { id, slotsDeleted: slotRes.deletedCount || 0 }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete timetable" });
  }
};

function validateSlotBody(body) {
  const dayOfWeek = Number(body?.dayOfWeek);
  const startMinute = Number(body?.startMinute);
  const durationMinutes = Number(body?.durationMinutes);
  const moduleId = body?.moduleId;
  const resourceId = body?.resourceId;
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) return "Invalid dayOfWeek";
  if (!Number.isFinite(startMinute) || startMinute < 0 || startMinute >= 24 * 60) return "Invalid startMinute";
  if (!Number.isFinite(durationMinutes) || durationMinutes < 30) return "Invalid durationMinutes";
  if (!moduleId || !resourceId) return "moduleId and resourceId are required";
  return null;
}

function slotsOverlap(aStart, aDuration, bStart, bDuration) {
  const aEnd = Number(aStart) + Number(aDuration);
  const bEnd = Number(bStart) + Number(bDuration);
  return Number(aStart) < bEnd && Number(bStart) < aEnd;
}

async function findConflictingSlot({
  timetableId,
  dayOfWeek,
  startMinute,
  durationMinutes,
  excludeSlotId = null
}) {
  const sameDaySlots = await TimetableSlot.find({
    timetable: timetableId,
    dayOfWeek: Number(dayOfWeek),
    ...(excludeSlotId ? { _id: { $ne: excludeSlotId } } : {})
  })
    .populate("module", "code name sessionType")
    .select("_id dayOfWeek startMinute durationMinutes labelSnapshot module")
    .lean();

  return sameDaySlots.find((s) =>
    slotsOverlap(startMinute, durationMinutes, s.startMinute, s.durationMinutes)
  );
}

async function findResourceConflictAcrossTimetables({
  userId,
  resourceId,
  dayOfWeek,
  startMinute,
  durationMinutes,
  excludeSlotId = null,
  excludeTimetableId = null
}) {
  if (!resourceId) return null;

  const timetables = await SemesterTimetable.find({
    user: userId,
    ...(excludeTimetableId ? { _id: { $ne: excludeTimetableId } } : {})
  })
    .select("_id year semester batchType")
    .lean();

  if (timetables.length === 0) return null;

  const timetableMap = new Map(timetables.map((t) => [String(t._id), t]));
  const timetableIds = timetables.map((t) => t._id);

  const candidateSlots = await TimetableSlot.find({
    timetable: { $in: timetableIds },
    resource: resourceId,
    dayOfWeek: Number(dayOfWeek),
    ...(excludeSlotId ? { _id: { $ne: excludeSlotId } } : {})
  })
    .select("_id timetable dayOfWeek startMinute durationMinutes labelSnapshot")
    .lean();

  const conflict = candidateSlots.find((s) =>
    slotsOverlap(startMinute, durationMinutes, s.startMinute, s.durationMinutes)
  );
  if (!conflict) return null;

  return {
    ...conflict,
    timetableInfo: timetableMap.get(String(conflict.timetable)) || null
  };
}

function conflictMessage(conflictingSlot) {
  const code = conflictingSlot?.labelSnapshot?.moduleCode || conflictingSlot?.module?.code || "module";
  const name = conflictingSlot?.labelSnapshot?.moduleName || conflictingSlot?.module?.name || "session";
  const type = conflictingSlot?.labelSnapshot?.sessionType || conflictingSlot?.module?.sessionType || "LECTURE";
  return `At this time you already have another ${String(type).toLowerCase()} (${code} ${name}). Please choose another time.`;
}

function resourceConflictMessage(conflictingSlot) {
  const resourceName = conflictingSlot?.labelSnapshot?.resourceName || "This hall/lab";
  const t = conflictingSlot?.timetableInfo;
  const where = t ? `Year ${t.year}, Semester ${t.semester} (${t.batchType})` : "another timetable";
  return `${resourceName} is already booked at this time in ${where}. Choose another time or another hall/lab.`;
}

function getSlotResourceId(slot) {
  if (!slot?.resource) return null;
  if (typeof slot.resource === "object" && slot.resource !== null) {
    return String(slot.resource._id || slot.resource.id || "");
  }
  return String(slot.resource);
}

export const addTimetableSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const timetable = await SemesterTimetable.findOne({ _id: id, user: req.user._id });
    if (!timetable) return res.status(404).json({ success: false, message: "Timetable not found" });

    const err = validateSlotBody(req.body);
    if (err) return res.status(400).json({ success: false, message: err });

    const moduleDoc = await Module.findOne({ _id: req.body.moduleId, user: req.user._id });
    if (!moduleDoc) return res.status(404).json({ success: false, message: "Module not found" });
    const resourceDoc = await Resource.findOne({ _id: req.body.resourceId, user: req.user._id });
    if (!resourceDoc) return res.status(404).json({ success: false, message: "Resource not found" });

    const conflictingSlot = await findConflictingSlot({
      timetableId: id,
      dayOfWeek: Number(req.body.dayOfWeek),
      startMinute: Number(req.body.startMinute),
      durationMinutes: Number(req.body.durationMinutes)
    });
    if (conflictingSlot) {
      return res.status(409).json({
        success: false,
        message: conflictMessage(conflictingSlot),
        data: { conflictingSlotId: conflictingSlot._id }
      });
    }

    const crossTimetableResourceConflict = await findResourceConflictAcrossTimetables({
      userId: req.user._id,
      resourceId: resourceDoc._id,
      dayOfWeek: Number(req.body.dayOfWeek),
      startMinute: Number(req.body.startMinute),
      durationMinutes: Number(req.body.durationMinutes),
      excludeTimetableId: id
    });
    if (crossTimetableResourceConflict) {
      return res.status(409).json({
        success: false,
        message: resourceConflictMessage(crossTimetableResourceConflict),
        data: { conflictingSlotId: crossTimetableResourceConflict._id }
      });
    }

    const doc = await TimetableSlot.create({
      timetable: id,
      module: moduleDoc._id,
      resource: resourceDoc._id,
      dayOfWeek: Number(req.body.dayOfWeek),
      startMinute: Number(req.body.startMinute),
      durationMinutes: Number(req.body.durationMinutes),
      labelSnapshot: {
        moduleCode: moduleDoc.code,
        moduleName: moduleDoc.name,
        sessionType: moduleDoc.sessionType,
        resourceName: resourceDoc.name,
        resourceType: resourceDoc.resourceType,
        resourceLocation: resourceDoc.location
      }
    });

    return res.status(201).json({ success: true, message: "Slot created", data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to add slot" });
  }
};

export const updateTimetableSlot = async (req, res) => {
  try {
    const { id, slotId } = req.params;
    const timetable = await SemesterTimetable.findOne({ _id: id, user: req.user._id });
    if (!timetable) return res.status(404).json({ success: false, message: "Timetable not found" });

    const existingSlot = await TimetableSlot.findOne({ _id: slotId, timetable: id });
    if (!existingSlot) return res.status(404).json({ success: false, message: "Slot not found" });

    if (req.body.dayOfWeek != null) {
      const d = Number(req.body.dayOfWeek);
      if (!Number.isInteger(d) || d < 1 || d > 7) {
        return res.status(400).json({ success: false, message: "Invalid dayOfWeek" });
      }
    }
    if (req.body.startMinute != null) {
      const m = Number(req.body.startMinute);
      if (!Number.isFinite(m) || m < 0 || m >= 24 * 60) {
        return res.status(400).json({ success: false, message: "Invalid startMinute" });
      }
    }
    if (req.body.durationMinutes != null) {
      const dm = Number(req.body.durationMinutes);
      if (!Number.isFinite(dm) || dm < 30) {
        return res.status(400).json({ success: false, message: "Invalid durationMinutes" });
      }
    }

    const updates = {};
    if (req.body.dayOfWeek != null) updates.dayOfWeek = Number(req.body.dayOfWeek);
    if (req.body.startMinute != null) updates.startMinute = Number(req.body.startMinute);
    if (req.body.durationMinutes != null) updates.durationMinutes = Number(req.body.durationMinutes);

    if (req.body.moduleId) {
      const moduleDoc = await Module.findOne({ _id: req.body.moduleId, user: req.user._id });
      if (!moduleDoc) return res.status(404).json({ success: false, message: "Module not found" });
      updates.module = moduleDoc._id;
      updates["labelSnapshot.moduleCode"] = moduleDoc.code;
      updates["labelSnapshot.moduleName"] = moduleDoc.name;
      updates["labelSnapshot.sessionType"] = moduleDoc.sessionType;
    }
    if (req.body.resourceId) {
      const resourceDoc = await Resource.findOne({ _id: req.body.resourceId, user: req.user._id });
      if (!resourceDoc) return res.status(404).json({ success: false, message: "Resource not found" });
      updates.resource = resourceDoc._id;
      updates["labelSnapshot.resourceName"] = resourceDoc.name;
      updates["labelSnapshot.resourceType"] = resourceDoc.resourceType;
      updates["labelSnapshot.resourceLocation"] = resourceDoc.location;
    }

    const nextDayOfWeek = updates.dayOfWeek ?? existingSlot.dayOfWeek;
    const nextStartMinute = updates.startMinute ?? existingSlot.startMinute;
    const nextDurationMinutes = updates.durationMinutes ?? existingSlot.durationMinutes;
    const conflictingSlot = await findConflictingSlot({
      timetableId: id,
      dayOfWeek: nextDayOfWeek,
      startMinute: nextStartMinute,
      durationMinutes: nextDurationMinutes,
      excludeSlotId: slotId
    });
    if (conflictingSlot) {
      return res.status(409).json({
        success: false,
        message: conflictMessage(conflictingSlot),
        data: { conflictingSlotId: conflictingSlot._id }
      });
    }

    const nextResourceId = updates.resource ?? existingSlot.resource;
    const crossTimetableResourceConflict = await findResourceConflictAcrossTimetables({
      userId: req.user._id,
      resourceId: nextResourceId,
      dayOfWeek: nextDayOfWeek,
      startMinute: nextStartMinute,
      durationMinutes: nextDurationMinutes,
      excludeTimetableId: id,
      excludeSlotId: slotId
    });
    if (crossTimetableResourceConflict) {
      return res.status(409).json({
        success: false,
        message: resourceConflictMessage(crossTimetableResourceConflict),
        data: { conflictingSlotId: crossTimetableResourceConflict._id }
      });
    }

    const updated = await TimetableSlot.findOneAndUpdate(
      { _id: slotId, timetable: id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Slot not found" });

    return res.status(200).json({ success: true, message: "Slot updated", data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update slot" });
  }
};

export const deleteTimetableSlot = async (req, res) => {
  try {
    const { id, slotId } = req.params;
    const timetable = await SemesterTimetable.findOne({ _id: id, user: req.user._id });
    if (!timetable) return res.status(404).json({ success: false, message: "Timetable not found" });

    const deleted = await TimetableSlot.findOneAndDelete({ _id: slotId, timetable: id });
    if (!deleted) return res.status(404).json({ success: false, message: "Slot not found" });

    return res.status(200).json({ success: true, message: "Slot deleted", data: { id: slotId } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete slot" });
  }
};

