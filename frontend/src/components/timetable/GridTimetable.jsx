import { useMemo } from "react";

const dayNames = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun"
};

function minutesToLabel(m) {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function intersects(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export default function GridTimetable({
  slots = [],
  days = [1, 2, 3, 4, 5],
  dayStartMinutes = 8 * 60,
  dayEndMinutes = 18 * 60,
  stepMinutes = 30,
  onSelectSlot
}) {
  const rows = useMemo(() => {
    const out = [];
    for (let t = dayStartMinutes; t < dayEndMinutes; t += stepMinutes) {
      out.push(t);
    }
    return out;
  }, [dayStartMinutes, dayEndMinutes, stepMinutes]);

  const slotsByDay = useMemo(() => {
    const map = new Map();
    for (const d of days) map.set(d, []);
    for (const s of slots) {
      const d = Number(s.dayOfWeek);
      if (!map.has(d)) continue;
      map.get(d).push(s);
    }
    for (const [d, list] of map.entries()) {
      list.sort((a, b) => (a.startMinute - b.startMinute));
      map.set(d, list);
    }
    return map;
  }, [slots, days]);

  const skipMap = useMemo(() => {
    const skip = new Map();
    for (const d of days) skip.set(d, new Set());

    for (const d of days) {
      const daySlots = slotsByDay.get(d) || [];
      const daySkip = skip.get(d);
      for (const s of daySlots) {
        const sStart = Number(s.startMinute);
        const sEnd = sStart + Number(s.durationMinutes);
        for (const t of rows) {
          if (t > sStart && t < sEnd) {
            daySkip.add(t);
          }
        }
      }
    }

    return skip;
  }, [days, rows, slotsByDay]);

  return (
    <div className="tt-grid-wrap">
      <table className="tt-grid-table">
        <thead>
          <tr>
            <th style={{ width: 90 }}>Time</th>
            {days.map((d) => (
              <th key={d}>{dayNames[d] || d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const tEnd = t + stepMinutes;
            return (
              <tr key={t}>
                <td className="tt-grid-time">{minutesToLabel(t)}</td>
                {days.map((d) => {
                  if (skipMap.get(d)?.has(t)) return null;

                  const daySlots = slotsByDay.get(d) || [];
                  const hit = daySlots.find((s) => {
                    const sStart = Number(s.startMinute);
                    const sEnd = sStart + Number(s.durationMinutes);
                    return sStart === t || intersects(t, tEnd, sStart, sEnd);
                  });
                  if (!hit) return <td key={d} className="tt-grid-empty" />;

                  const rowSpan = Math.max(1, Math.ceil(Number(hit.durationMinutes) / stepMinutes));
                  const label = hit.labelSnapshot?.moduleCode
                    ? `${hit.labelSnapshot.moduleCode} (${hit.labelSnapshot.sessionType || ""})`
                    : (hit.labelSnapshot?.moduleName || "Session");
                  const room = hit.labelSnapshot?.resourceName || "";
                  return (
                    <td
                      key={d}
                      rowSpan={rowSpan}
                      className="tt-grid-slot"
                      style={{ cursor: onSelectSlot ? "pointer" : "default" }}
                      onClick={() => onSelectSlot?.(hit)}
                      title="Click to edit"
                    >
                      <div className="tt-grid-slot__title">{label}</div>
                      <div className="tt-grid-slot__meta">{room}</div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

