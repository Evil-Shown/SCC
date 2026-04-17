import { ResourceTypes } from "../models/Resource.js";
import { RoomTypes } from "../models/Module.js";

function clampInt(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  const i = Math.floor(v);
  return Math.min(max, Math.max(min, i));
}

function buildDaysForBatch(batchType) {
  // dayOfWeek: Mon=1..Sun=7
  if (batchType === "WEEKEND") return [6, 7];
  return [1, 2, 3, 4, 5];
}

function overlaps(aStart, aDur, bStart, bDur) {
  const aEnd = aStart + aDur;
  const bEnd = bStart + bDur;
  return aStart < bEnd && bStart < aEnd;
}

export function materializeSlotToEvent({ dayOfWeek, startMinute, durationMinutes, title, subjectCode, type, location, metadata }) {
  // Reference Monday: 2020-01-06
  const base = new Date(Date.UTC(2020, 0, 6, 0, 0, 0, 0));
  const dayOffset = clampInt(dayOfWeek, 1, 7, 1) - 1;
  const start = new Date(base);
  start.setUTCDate(base.getUTCDate() + dayOffset);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMinutes(clampInt(startMinute, 0, 24 * 60, 0));
  const end = new Date(start);
  end.setUTCMinutes(start.getUTCMinutes() + clampInt(durationMinutes, 30, 24 * 60, 60));
  return { title, subjectCode, type, start, end, location, metadata: metadata || {} };
}

export function materializeSlotsToEvents(slots = []) {
  return (Array.isArray(slots) ? slots : [])
    .map((s) => {
      const title =
        s?.labelSnapshot?.moduleCode
          ? `${s.labelSnapshot.moduleCode} ${s.labelSnapshot.moduleName || ""}`.trim()
          : (s?.labelSnapshot?.moduleName || "Session");
      const type = String(s?.labelSnapshot?.sessionType || "").toLowerCase() || "lecture";
      const location =
        s?.labelSnapshot?.resourceLocation
          ? `${s.labelSnapshot.resourceName} (${s.labelSnapshot.resourceLocation})`
          : (s?.labelSnapshot?.resourceName || "");
      return materializeSlotToEvent({
        dayOfWeek: s.dayOfWeek,
        startMinute: s.startMinute,
        durationMinutes: s.durationMinutes,
        title,
        subjectCode: s?.labelSnapshot?.moduleCode || "",
        type,
        location,
        metadata: { slotId: s._id || undefined, generated: s?.metadata?.generated === true }
      });
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start));
}

function makeResourcePool(resources, requiredRoomType) {
  if (requiredRoomType === RoomTypes.LAB) {
    return resources.filter((r) => r.resourceType === ResourceTypes.LAB);
  }
  return resources.filter((r) => r.resourceType === ResourceTypes.LECTURE_HALL);
}

function isSlotFeasible(
  { dayOfWeek, startMinute, durationMinutes, resourceId },
  placedByDay,
  externalResourceByDay = new Map()
) {
  const existing = placedByDay.get(dayOfWeek) || [];
  for (const s of existing) {
    if (overlaps(startMinute, durationMinutes, s.startMinute, s.durationMinutes)) {
      // cohort timetable: no overlaps, regardless of room
      return false;
    }
    if (String(s.resource) === String(resourceId) && overlaps(startMinute, durationMinutes, s.startMinute, s.durationMinutes)) {
      return false;
    }
  }

  const external = externalResourceByDay.get(dayOfWeek) || [];
  for (const s of external) {
    if (
      String(s.resource) === String(resourceId) &&
      overlaps(startMinute, durationMinutes, s.startMinute, s.durationMinutes)
    ) {
      // Prevent same hall/lab collisions with other semester timetables.
      return false;
    }
  }

  return true;
}

function addPlaced(slot, placed, placedByDay, dayLoad) {
  placed.push(slot);
  const list = placedByDay.get(slot.dayOfWeek) || [];
  list.push(slot);
  placedByDay.set(slot.dayOfWeek, list);
  dayLoad.set(slot.dayOfWeek, (dayLoad.get(slot.dayOfWeek) || 0) + slot.durationMinutes);
}

function removePlaced(slot, placed, placedByDay, dayLoad) {
  const idx = placed.lastIndexOf(slot);
  if (idx >= 0) placed.splice(idx, 1);
  const list = placedByDay.get(slot.dayOfWeek) || [];
  const j = list.lastIndexOf(slot);
  if (j >= 0) list.splice(j, 1);
  placedByDay.set(slot.dayOfWeek, list);
  dayLoad.set(slot.dayOfWeek, Math.max(0, (dayLoad.get(slot.dayOfWeek) || 0) - slot.durationMinutes));
}

export async function generateSemesterTimetableSlots({
  timetable,
  resources = [],
  modules = [],
  externalResourceSlots = []
}) {
  const cfg = timetable?.generationConfig || {};
  const dayStartMinutes = clampInt(cfg.dayStartMinutes, 0, 24 * 60, 8 * 60);
  const dayEndMinutes = clampInt(cfg.dayEndMinutes, 0, 24 * 60, 18 * 60);
  const step = clampInt(cfg.slotStepMinutes, 5, 240, 30);

  const days = buildDaysForBatch(timetable?.batchType);

  const expanded = [];
  for (const m of modules) {
    const times = clampInt(m.sessionsPerWeek, 1, 20, 1);
    for (let i = 0; i < times; i++) expanded.push({ module: m, instance: i });
  }

  // Greedy ordering: longer first, then LAB-required first.
  expanded.sort((a, b) => {
    const ad = Number(a.module.durationMinutes) || 60;
    const bd = Number(b.module.durationMinutes) || 60;
    if (bd !== ad) return bd - ad;
    const aLab = a.module.requiredRoomType === RoomTypes.LAB ? 1 : 0;
    const bLab = b.module.requiredRoomType === RoomTypes.LAB ? 1 : 0;
    return bLab - aLab;
  });

  const placed = [];

  const dayLoad = new Map(days.map((d) => [d, 0]));
  const byDay = new Map(days.map((d) => [d, []]));
  const externalByDay = new Map(days.map((d) => [d, []]));
  for (const s of externalResourceSlots || []) {
    const day = Number(s?.dayOfWeek);
    if (!externalByDay.has(day)) continue;
    externalByDay.get(day).push({
      resource: s.resource,
      startMinute: Number(s.startMinute),
      durationMinutes: Number(s.durationMinutes)
    });
  }

  const buildCandidatesForItem = (item) => {
    const moduleDoc = item.module;
    const dur = clampInt(moduleDoc.durationMinutes, 30, 480, 60);
    const pool = makeResourcePool(resources, moduleDoc.requiredRoomType);
    if (pool.length === 0) {
      throw new Error(`No resources available for ${moduleDoc.requiredRoomType}`);
    }

    const dayOrder = [...days].sort((a, b) => (dayLoad.get(a) || 0) - (dayLoad.get(b) || 0));
    const out = [];
    for (const dayOfWeek of dayOrder) {
      for (let start = dayStartMinutes; start + dur <= dayEndMinutes; start += step) {
        for (const res of pool) {
          out.push({ dayOfWeek, startMinute: start, durationMinutes: dur, resource: res, moduleDoc });
        }
      }
    }
    return out;
  };

  const maxBacktrackNodes = clampInt(cfg.maxBacktrackNodes, 100, 50000, 8000);
  let visited = 0;

  const tryPlace = (idx) => {
    if (visited++ > maxBacktrackNodes) return false;
    if (idx >= expanded.length) return true;

    const item = expanded[idx];
    const candidates = buildCandidatesForItem(item);

    for (const c of candidates) {
      const ok = isSlotFeasible(
        {
          dayOfWeek: c.dayOfWeek,
          startMinute: c.startMinute,
          durationMinutes: c.durationMinutes,
          resourceId: c.resource._id
        },
        byDay,
        externalByDay
      );
      if (!ok) continue;

      const slot = {
        timetable: timetable._id,
        module: c.moduleDoc._id,
        resource: c.resource._id,
        dayOfWeek: c.dayOfWeek,
        startMinute: c.startMinute,
        durationMinutes: c.durationMinutes,
        labelSnapshot: {
          moduleCode: c.moduleDoc.code,
          moduleName: c.moduleDoc.name,
          sessionType: c.moduleDoc.sessionType,
          resourceName: c.resource.name,
          resourceType: c.resource.resourceType,
          resourceLocation: c.resource.location
        },
        metadata: { generated: true, instance: item.instance }
      };

      addPlaced(slot, placed, byDay, dayLoad);
      if (tryPlace(idx + 1)) return true;
      removePlaced(slot, placed, byDay, dayLoad);
    }
    return false;
  };

  const ok = tryPlace(0);
  if (!ok) {
    const err = visited > maxBacktrackNodes
      ? "Generation timed out (too many possibilities). Reduce modules or expand working hours/resources."
      : "Unable to place all sessions within constraints.";
    throw new Error(err);
  }

  placed.sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || (a.startMinute - b.startMinute));
  return placed;
}

