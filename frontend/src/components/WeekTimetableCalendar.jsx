import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../styles/TimetableCalendar.css";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun ... 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatRangeLabel(weekStart) {
  const end = addDays(weekStart, 6);
  const opts = { month: "short", day: "numeric" };
  const startStr = weekStart.toLocaleDateString(undefined, opts);
  const endStr = end.toLocaleDateString(undefined, opts);
  return `${startStr} – ${endStr}`;
}

function eventColor(event) {
  if (event.type === "study") return "study";
  if (event.type === "lab") return "lab";
  if (event.type === "tutorial") return "tutorial";
  return "lecture";
}

function formatDateTime(d) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const dateStr = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
  return `${dateStr} ${timeStr}`;
}

export default function WeekTimetableCalendar({
  events,
  initialDate = new Date(),
  minHour = 6,
  maxHour = 22,
  title = "Week view"
}) {
  const [anchor, setAnchor] = useState(() => startOfWeekMonday(initialDate));
  const [activeEvent, setActiveEvent] = useState(null);

  useEffect(() => {
    if (!events?.length) setActiveEvent(null);
  }, [events]);

  const days = useMemo(() => DAY_NAMES.map((_, i) => addDays(anchor, i)), [anchor]);
  const rangeLabel = useMemo(() => formatRangeLabel(anchor), [anchor]);

  const prepared = useMemo(() => {
    const minM = minHour * 60;
    const maxM = maxHour * 60;

    const normalized = (events || [])
      .map((e) => {
        const start = new Date(e.start);
        const end = new Date(e.end);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
        if (end <= start) return null;
        return { ...e, _start: start, _end: end };
      })
      .filter(Boolean);

    const byDay = days.map((day) => {
      const dayEvents = normalized
        .filter((e) => sameDay(e._start, day))
        .map((e) => {
          const startMin = clamp(minutesSinceMidnight(e._start), minM, maxM);
          const endMin = clamp(minutesSinceMidnight(e._end), minM, maxM);
          return {
            ...e,
            _startMin: startMin,
            _endMin: Math.max(startMin + 10, endMin) // minimum visible height
          };
        })
        .filter((e) => e._endMin > e._startMin);

      dayEvents.sort((a, b) => a._startMin - b._startMin || a._endMin - b._endMin);

      // simple overlap stacking (not perfect, but good UI)
      const lanesEnd = [];
      const withLane = dayEvents.map((e) => {
        let lane = lanesEnd.findIndex((end) => end <= e._startMin);
        if (lane === -1) {
          lane = lanesEnd.length;
          lanesEnd.push(e._endMin);
        } else {
          lanesEnd[lane] = e._endMin;
        }
        return { ...e, _lane: lane, _laneCount: Math.max(1, lanesEnd.length) };
      });

      const laneCount = Math.max(1, lanesEnd.length);
      return withLane.map((e) => ({ ...e, _laneCount: laneCount }));
    });

    const hours = [];
    for (let h = minHour; h <= maxHour; h++) hours.push(h);

    return { byDay, hours, minM, maxM };
  }, [events, days, minHour, maxHour]);

  const totalMinutes = prepared.maxM - prepared.minM;

  return (
    <div
      className="ttcal"
    >
      <div className="ttcal__top">
        <div>
          <div className="ttcal__title">{title}</div>
          <div className="ttcal__subtitle">{rangeLabel}</div>
        </div>
        <div className="ttcal__controls">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setAnchor((d) => addDays(d, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
            Prev
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setAnchor(startOfWeekMonday(new Date()))}
          >
            This week
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setAnchor((d) => addDays(d, 7))}
            aria-label="Next week"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="ttcal__grid">
        <div className="ttcal__corner" />
        <div className="ttcal__days">
          {days.map((d, idx) => (
            <div key={idx} className="ttcal__dayHead">
              <div className="ttcal__dayName">{DAY_NAMES[idx]}</div>
              <div className="ttcal__dayDate">
                {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </div>
            </div>
          ))}
        </div>

        <div className="ttcal__times">
          {prepared.hours.map((h) => (
            <div key={h} className="ttcal__time">
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="ttcal__body">
          {days.map((_, dayIndex) => (
            <div key={dayIndex} className="ttcal__col">
              {prepared.hours.map((h) => (
                <div key={h} className="ttcal__hourLine" />
              ))}

              {(prepared.byDay[dayIndex] || []).map((e, idx) => {
                const topPct = ((e._startMin - prepared.minM) / totalMinutes) * 100;
                const heightPct = ((e._endMin - e._startMin) / totalMinutes) * 100;
                const laneWidth = 100 / e._laneCount;
                const leftPct = e._lane * laneWidth;
                const widthPct = laneWidth;
                const colorKey = eventColor(e);

                return (
                  <div
                    key={`${dayIndex}-${idx}`}
                    className={`ttcal__event ttcal__event--${colorKey}`}
                    style={{
                      top: `${topPct}%`,
                      height: `${heightPct}%`,
                      left: `calc(${leftPct}% + 6px)`,
                      width: `calc(${widthPct}% - 12px)`
                    }}
                    onPointerDown={(ev) => {
                      ev.stopPropagation();
                      setActiveEvent(e);
                    }}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setActiveEvent(e);
                    }}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        ev.stopPropagation();
                        setActiveEvent(e);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    title={`${e.title}\n${formatDateTime(e.start)}–${formatDateTime(e.end)}${
                      e.location ? `\n${e.location}` : ""
                    }`}
                  >
                    <div className="ttcal__eventTitle">{e.title || "Untitled"}</div>
                    <div className="ttcal__eventMeta">
                      {formatDateTime(e.start)}–{formatDateTime(e.end)}
                      {e.location ? ` • ${e.location}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {activeEvent && (
        <div
          className="ttcal__modalOverlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveEvent(null)}
        >
          <div
            className="ttcal__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ttcal__modalHeader">
              <div className="ttcal__modalTitle">{activeEvent.title || "Untitled"}</div>
              <button
                type="button"
                className="ttcal__modalClose"
                onClick={() => setActiveEvent(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="ttcal__modalBody">
              <div className="ttcal__modalLine">
                <strong>Time:</strong>{" "}
                {formatDateTime(activeEvent.start)}–{formatDateTime(activeEvent.end)}
              </div>
              {activeEvent.location ? (
                <div className="ttcal__modalLine">
                  <strong>Location:</strong> {activeEvent.location}
                </div>
              ) : null}
              {activeEvent.type ? (
                <div className="ttcal__modalLine">
                  <strong>Type:</strong> {activeEvent.type}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

WeekTimetableCalendar.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      start: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      end: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      type: PropTypes.string,
      location: PropTypes.string
    })
  ),
  initialDate: PropTypes.instanceOf(Date),
  minHour: PropTypes.number,
  maxHour: PropTypes.number,
  title: PropTypes.string
};

