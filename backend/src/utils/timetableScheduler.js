/**
 * Detect overlapping events in a schedule.
 * Returns an array of conflict pairs: [{ a, b }, ...]
 */
export const findScheduleConflicts = (events = []) => {
  if (!Array.isArray(events) || events.length < 2) {
    return [];
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.start) - new Date(b.start)
  );

  const conflicts = [];

  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    const aStart = new Date(a.start);
    const aEnd = new Date(a.end);

    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      const bStart = new Date(b.start);
      const bEnd = new Date(b.end);

      // Since list is sorted by start time, if the next event starts
      // after the current one ends, no further conflicts with "a".
      if (bStart >= aEnd) {
        break;
      }

      const overlaps =
        aStart < bEnd &&
        bStart < aEnd;

      if (overlaps) {
        conflicts.push({ a, b });
      }
    }
  }

  return conflicts;
};

/**
 * Simple rule-based timetable optimizer.
 *
 * Inputs:
 * - universitySchedule: array of events (title, subjectCode, start, end, etc.)
 * - options: { difficultyLevels, preferredStudyHours }
 *
 * Behaviour:
 * - Adds study sessions based on subject difficulty.
 * - Tries to place sessions inside the preferredStudyHours window,
 *   avoiding overlaps with existing events where possible.
 *
 * Output:
 * - optimizedSchedule: array of events including added study blocks.
 */
export const generateOptimizedSchedule = (universitySchedule = [], options = {}) => {
  const {
    difficultyLevels = {},
    preferredStudyHours = { startHour: 18, endHour: 21 },
    subjectPriorities = {},
    personalCommitments = [],
    balanceRules = {},
    restDays = []
  } = options;

  // Clone base schedule so we don't mutate incoming data
  const optimized = [...universitySchedule];

  // Use the actual timetable dates (not "today") so study/work blocks appear in the right week.
  const candidateDates = (() => {
    const map = new Map(); // key -> Date (midnight)
    for (const evt of universitySchedule) {
      if (!evt?.start) continue;
      const d = new Date(evt.start);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) {
        const midnight = new Date(d);
        midnight.setHours(0, 0, 0, 0);
        map.set(key, midnight);
      }
    }
    return [...map.values()].sort((a, b) => a - b);
  })();

  // Helper to get all events on a given calendar date
  const getEventsOnDate = (events, date) => {
    return events.filter((evt) => {
      const d = new Date(evt.start);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });
  };

  const parseHour = (value, fallback) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(23.99, n));
  };

  const dayKey = (date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  const normalizeWeekday = (day) => {
    if (typeof day === "number" && Number.isInteger(day)) {
      // Accept JS day (0-6, Sun-Sat)
      if (day >= 0 && day <= 6) return day;
      return null;
    }
    if (typeof day !== "string") return null;
    const s = day.trim().toLowerCase();
    const map = {
      sun: 0,
      sunday: 0,
      mon: 1,
      monday: 1,
      tue: 2,
      tues: 2,
      tuesday: 2,
      wed: 3,
      wednesday: 3,
      thu: 4,
      thur: 4,
      thurs: 4,
      thursday: 4,
      fri: 5,
      friday: 5,
      sat: 6,
      saturday: 6
    };
    return Object.prototype.hasOwnProperty.call(map, s) ? map[s] : null;
  };

  const normalizedRestDays = new Set(
    (Array.isArray(restDays) ? restDays : [])
      .map((d) => normalizeWeekday(d))
      .filter((d) => d !== null)
  );

  // Convert recurring personal commitments (e.g. gym) into concrete blocks on candidate dates.
  const commitmentByWeekday = (Array.isArray(personalCommitments) ? personalCommitments : [])
    .map((c) => ({
      title: c?.title || "Personal commitment",
      weekday: normalizeWeekday(c?.dayOfWeek),
      startHour: parseHour(c?.startHour, null),
      endHour: parseHour(c?.endHour, null)
    }))
    .filter((c) => c.weekday !== null && c.startHour !== null && c.endHour !== null && c.endHour > c.startHour);

  const commitmentEventsForDate = (date) => {
    const weekday = date.getDay(); // 0-6
    const matches = commitmentByWeekday.filter((c) => c.weekday === weekday);
    return matches.map((c) => {
      const start = new Date(date);
      const end = new Date(date);
      const sh = Math.floor(c.startHour);
      const sm = Math.round((c.startHour - sh) * 60);
      const eh = Math.floor(c.endHour);
      const em = Math.round((c.endHour - eh) * 60);
      start.setHours(sh, sm, 0, 0);
      end.setHours(eh, em, 0, 0);
      return {
        title: c.title,
        type: "other",
        start,
        end,
        location: "Personal"
      };
    });
  };

  // Group events by subjectCode to know what needs more study time
  const subjects = new Map();
  for (const event of universitySchedule) {
    const code = event.subjectCode || event.title;
    if (!code) continue;
    if (!subjects.has(code)) {
      subjects.set(code, []);
    }
    subjects.get(code).push(event);
  }

  const today = new Date();
  const dailyStudyStats = new Map(); // yyyy-m-d => { sessions, minutes }
  const maxStudySessionsPerDay = Number.isFinite(Number(balanceRules?.maxStudySessionsPerDay))
    ? Math.max(1, Number(balanceRules.maxStudySessionsPerDay))
    : 2;
  const maxStudyMinutesPerDay = Number.isFinite(Number(balanceRules?.maxStudyMinutesPerDay))
    ? Math.max(30, Number(balanceRules.maxStudyMinutesPerDay))
    : 180;

  // For each subject, add a number of study blocks per week based on difficulty
  for (const [code] of subjects.entries()) {
    const difficulty = difficultyLevels[code] || "medium";
    const priority = String(subjectPriorities?.[code] || "medium").toLowerCase();

    let studySessionsPerWeek;
    let studyDurationMinutes;

    switch (difficulty) {
      case "easy":
        studySessionsPerWeek = 1;
        studyDurationMinutes = 45;
        break;
      case "hard":
        studySessionsPerWeek = 3;
        studyDurationMinutes = 90;
        break;
      case "medium":
      default:
        studySessionsPerWeek = 2;
        studyDurationMinutes = 60;
        break;
    }

    // If caller requested a fixed session length (e.g. 2 hours), enforce it.
    if (Number.isFinite(Number(balanceRules?.sessionDurationMinutes))) {
      studyDurationMinutes = Math.max(30, Number(balanceRules.sessionDurationMinutes));
    }

    // Priority tuning on top of difficulty:
    // high => more frequent/longer, low => lighter.
    if (priority === "high") {
      studySessionsPerWeek += 1;
      studyDurationMinutes += 15;
    } else if (priority === "low") {
      studySessionsPerWeek = Math.max(1, studySessionsPerWeek - 1);
      studyDurationMinutes = Math.max(30, studyDurationMinutes - 15);
    }

    for (let i = 0; i < studySessionsPerWeek; i++) {
      // Try to place this session on any of the timetable dates that exist.
      // This avoids "first dates are packed => no study blocks anywhere".
      const dateCandidates =
        candidateDates.length > 0
          ? candidateDates
          : (() => {
              const fallback = [];
              for (let k = 0; k < studySessionsPerWeek; k++) {
                const d = new Date(today);
                d.setDate(today.getDate() + k);
                fallback.push(d);
              }
              return fallback;
            })();

      let placedEvent = null;

      for (let t = 0; t < dateCandidates.length; t++) {
        const idx = (t + i) % dateCandidates.length;
        const baseDate = new Date(dateCandidates[idx]);
        if (normalizedRestDays.has(baseDate.getDay())) {
          continue;
        }
        const statsKey = dayKey(baseDate);
        const stats = dailyStudyStats.get(statsKey) || { sessions: 0, minutes: 0 };
        if (
          stats.sessions >= maxStudySessionsPerDay ||
          stats.minutes + studyDurationMinutes > maxStudyMinutesPerDay
        ) {
          continue;
        }

        // Try to find a free slot within the preferred window on this day
        const dayEvents = [
          ...getEventsOnDate(optimized, baseDate),
          ...commitmentEventsForDate(baseDate)
        ].sort((a, b) => new Date(a.start) - new Date(b.start));

        // Start with preferred window
        let slotStart = new Date(baseDate);
        slotStart.setHours(preferredStudyHours.startHour, 0, 0, 0);

        const windowEnd = new Date(baseDate);
        windowEnd.setHours(preferredStudyHours.endHour, 0, 0, 0);

        const fitsInWindow = (start) => {
          const end = new Date(start);
          end.setMinutes(end.getMinutes() + studyDurationMinutes);
          return end <= windowEnd;
        };

        let placed = false;

        // Slide the study block after any overlapping classes until we find a gap
        for (const evt of dayEvents) {
          const evtStart = new Date(evt.start);
          const evtEnd = new Date(evt.end);

          // If our proposed slot ends before this event starts, we are good
          const proposedEnd = new Date(slotStart);
          proposedEnd.setMinutes(
            proposedEnd.getMinutes() + studyDurationMinutes
          );

          if (proposedEnd <= evtStart) {
            if (fitsInWindow(slotStart)) {
              placed = true;
            }
            break;
          }

          // If our slot overlaps this event, push it to after the class
          if (slotStart < evtEnd && proposedEnd > evtStart) {
            slotStart = new Date(evtEnd);
          }
        }

        // If we went through all events and still haven't placed, try at final slotStart
        if (!placed && fitsInWindow(slotStart)) {
          placed = true;
        }

        if (!placed) continue;

        const finalStart = new Date(slotStart);
        const finalEnd = new Date(finalStart);
        finalEnd.setMinutes(finalEnd.getMinutes() + studyDurationMinutes);

        placedEvent = {
          title: `${code} - Work Plan`,
          subjectCode: code,
          type: "study",
          start: finalStart,
          end: finalEnd,
          location: "Work Plan",
          metadata: {
            difficulty,
            generated: true
          }
        };
        dailyStudyStats.set(statsKey, {
          sessions: stats.sessions + 1,
          minutes: stats.minutes + studyDurationMinutes
        });
        break;
      }

      if (placedEvent) optimized.push(placedEvent);
    }
  }

  // Basic sort by start time
  optimized.sort((a, b) => new Date(a.start) - new Date(b.start));

  return optimized;
};

