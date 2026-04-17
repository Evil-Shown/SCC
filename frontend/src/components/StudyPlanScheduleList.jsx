import PropTypes from "prop-types";
import { useMemo } from "react";
import { BookOpen, FlaskConical, Layers, MapPin, Sparkles } from "lucide-react";

function eventKind(event) {
  const type = String(event.type || "").toLowerCase();
  const title = String(event.title || "").toLowerCase();
  if (type === "study" || title.includes("study")) return "study";
  if (type === "lab" || title.includes("lab")) return "lab";
  if (type === "tutorial" || title.includes("tutorial")) return "tutorial";
  return "lecture";
}

function kindIcon(kind) {
  if (kind === "study") return <Sparkles size={14} aria-hidden />;
  if (kind === "lab") return <FlaskConical size={14} aria-hidden />;
  if (kind === "tutorial") return <Layers size={14} aria-hidden />;
  return <BookOpen size={14} aria-hidden />;
}

function formatTimeRange(start, end) {
  const opts = { hour: "2-digit", minute: "2-digit" };
  const a = start.toLocaleTimeString(undefined, opts);
  const b = end.toLocaleTimeString(undefined, opts);
  return `${a} – ${b}`;
}

/**
 * Read-only schedule: groups events by weekday, sorted by time (no calendar grid).
 */
export default function StudyPlanScheduleList({ events = [], title = "" }) {
  const sections = useMemo(() => {
    const normalized = (events || [])
      .map((e) => {
        const start = new Date(e.start);
        const end = new Date(e.end);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
        if (end <= start) return null;
        return { raw: e, start, end, kind: eventKind(e) };
      })
      .filter(Boolean);

    normalized.sort((a, b) => a.start - b.start || a.end - b.end);

    const byDate = new Map();
    for (const row of normalized) {
      const y = row.start.getFullYear();
      const mo = row.start.getMonth();
      const d = row.start.getDate();
      const key = `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (!byDate.has(key)) byDate.set(key, { label: "", rows: [] });
      byDate.get(key).rows.push(row);
    }

    for (const [, block] of byDate) {
      const first = block.rows[0]?.start;
      block.label = first
        ? first.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
        : "";
    }

    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, block]) => ({ day: block.label, rows: block.rows }));
  }, [events]);

  return (
    <div className="tt-study-plan-list">
      {title ? <h3 className="tt-study-plan-list__heading">{title}</h3> : null}
      {sections.length === 0 ? (
        <p className="tt-study-plan-list__empty">No sessions in this plan.</p>
      ) : (
        sections.map(({ day, rows }) => (
          <section key={`${day}-${rows[0]?.start?.getTime?.() ?? 0}`} className="tt-study-plan-list__day-block">
            <h4 className="tt-study-plan-list__day-title">{day}</h4>
            <ul className="tt-study-plan-list__ul">
              {rows.map(({ raw, start, end, kind }, idx) => (
                <li
                  key={`${day}-${idx}-${raw.title || ""}-${start.getTime()}`}
                  className={`tt-study-plan-list__item tt-study-plan-list__item--${kind}`}
                >
                  <div className="tt-study-plan-list__item-main">
                    <span className="tt-study-plan-list__kind" aria-hidden>
                      {kindIcon(kind)}
                    </span>
                    <div className="tt-study-plan-list__body">
                      <div className="tt-study-plan-list__title-row">
                        <span className="tt-study-plan-list__time">{formatTimeRange(start, end)}</span>
                        <span className="tt-study-plan-list__title">{raw.title || "Session"}</span>
                      </div>
                      {raw.subjectCode ? (
                        <span className="tt-study-plan-list__code">{raw.subjectCode}</span>
                      ) : null}
                      {raw.location ? (
                        <div className="tt-study-plan-list__loc">
                          <MapPin size={12} aria-hidden />
                          <span>{raw.location}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

StudyPlanScheduleList.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.string
};
