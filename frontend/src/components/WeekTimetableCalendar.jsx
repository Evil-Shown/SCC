import PropTypes from "prop-types";
import { useEffect, useMemo, useState, useRef } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  BookOpen, 
  FlaskConical, 
  Layers, 
  Sparkles,
  Calendar as CalendarIcon,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  const type = String(event.type || "").toLowerCase();
  const title = String(event.title || "").toLowerCase();
  if (type === "study" || title.includes("study")) return "study";
  if (type === "lab" || title.includes("lab")) return "lab";
  if (type === "tutorial" || title.includes("tutorial")) return "tutorial";
  return "lecture";
}

function getEventIcon(event) {
  const type = String(event.type || "").toLowerCase();
  const title = String(event.title || "").toLowerCase();
  if (type === "study" || title.includes("study")) return <Sparkles size={14} />;
  if (type === "lab" || title.includes("lab")) return <FlaskConical size={14} />;
  if (type === "tutorial" || title.includes("tutorial")) return <Layers size={14} />;
  return <BookOpen size={14} />;
}

function formatDateTime(d) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
}

const CurrentTimeIndicator = ({ minHour, maxHour }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const totalMin = (maxHour - minHour) * 60;
  const currentMin = minutesSinceMidnight(now);
  
  if (currentMin < minHour * 60 || currentMin > maxHour * 60) return null;

  const topPct = ((currentMin - minHour * 60) / totalMin) * 100;

  return (
    <div className="ttcal__now-line" style={{ top: `${topPct}%` }}>
      <div className="ttcal__now-dot" />
      <div className="ttcal__now-label">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  );
};

export default function WeekTimetableCalendar({
  events,
  initialDate = new Date(),
  minHour = 6,
  maxHour = 22,
  title = "Week view"
}) {
  const [anchor, setAnchor] = useState(() => startOfWeekMonday(initialDate));
  const [activeEvent, setActiveEvent] = useState(null);
  const scrollContainerRef = useRef(null);

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
            _endMin: Math.max(startMin + 15, endMin) // minimum visible height
          };
        })
        .filter((e) => e._endMin > e._startMin);

      dayEvents.sort((a, b) => a._startMin - b._startMin || a._endMin - b._endMin);

      const lanesEnd = [];
      const withLane = dayEvents.map((e) => {
        let lane = lanesEnd.findIndex((end) => end <= e._startMin);
        if (lane === -1) {
          lane = lanesEnd.length;
          lanesEnd.push(e._endMin);
        } else {
          lanesEnd[lane] = e._endMin;
        }
        return { ...e, _lane: lane };
      });

      const maxLanes = Math.max(1, lanesEnd.length);
      return withLane.map(e => ({ ...e, _laneCount: maxLanes }));
    });

    const hours = [];
    for (let h = minHour; h <= maxHour; h++) hours.push(h);

    return { byDay, hours, minM, maxM };
  }, [events, days, minHour, maxHour]);

  const totalMinutes = prepared.maxM - prepared.minM;

  return (
    <div className="ttcal-wrapper">
      <div className="ttcal__top">
        <div className="ttcal__header-info">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="ttcal__title-group"
          >
            <div className="ttcal__title-icon">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h2 className="ttcal__title">{title}</h2>
              <p className="ttcal__subtitle">{rangeLabel}</p>
            </div>
          </motion.div>
        </div>

        <div className="ttcal__controls">
          <div className="ttcal__nav-group">
            <button
              type="button"
              className="ttcal__nav-btn"
              onClick={() => setAnchor((d) => addDays(d, -7))}
              aria-label="Previous week"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="ttcal__today-btn"
              onClick={() => setAnchor(startOfWeekMonday(new Date()))}
            >
              Today
            </button>
            <button
              type="button"
              className="ttcal__nav-btn"
              onClick={() => setAnchor((d) => addDays(d, 7))}
              aria-label="Next week"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <motion.div 
        className="ttcal__container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="ttcal__grid" ref={scrollContainerRef}>
          <div className="ttcal__corner" />
          <div className="ttcal__days">
            {days.map((d, idx) => {
              const isToday = sameDay(d, new Date());
              return (
                <div key={idx} className={`ttcal__dayHead ${isToday ? 'is-today' : ''}`}>
                  <div className="ttcal__dayName">{DAY_NAMES[idx]}</div>
                  <div className="ttcal__dayDate">
                    {d.getDate()}
                    <span>{d.toLocaleDateString(undefined, { month: 'short' })}</span>
                  </div>
                  {isToday && <motion.div layoutId="today-indicator" className="ttcal__today-pill" />}
                </div>
              );
            })}
          </div>

          <div className="ttcal__times">
            {prepared.hours.map((h) => (
              <div key={h} className="ttcal__time">
                <span>{String(h).padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>

          <div className="ttcal__body">
            <CurrentTimeIndicator minHour={minHour} maxHour={maxHour} />
            
            {days.map((d, dayIndex) => (
              <div key={dayIndex} className={`ttcal__col ${sameDay(d, new Date()) ? 'is-today' : ''}`}>
                {prepared.hours.map((h) => (
                  <div key={h} className="ttcal__hourLine" />
                ))}

                <AnimatePresence mode="popLayout">
                  {(prepared.byDay[dayIndex] || []).map((e, idx) => {
                    const topPct = ((e._startMin - prepared.minM) / totalMinutes) * 100;
                    const heightPct = ((e._endMin - e._startMin) / totalMinutes) * 100;
                    const laneWidth = 100 / e._laneCount;
                    const leftPct = e._lane * laneWidth;
                    const colorKey = eventColor(e);
                    const Icon = getEventIcon(e);

                    return (
                      <motion.div
                        key={`${dayIndex}-${e.title}-${e.start}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -2, scale: 1.02 }}
                        className={`ttcal__event ttcal__event--${colorKey}`}
                        style={{
                          top: `${topPct}%`,
                          height: `${heightPct}%`,
                          left: `calc(${leftPct}% + 4px)`,
                          width: `calc(${laneWidth}% - 8px)`
                        }}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setActiveEvent(e);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="ttcal__event-inner">
                          <div className="ttcal__event-header">
                            <span className="ttcal__event-icon">{Icon}</span>
                            <span className="ttcal__event-time">{formatDateTime(e.start)}</span>
                          </div>
                          <div className="ttcal__event-title">{e.title || "Untitled"}</div>
                          {heightPct > 8 && e.location && (
                            <div className="ttcal__event-loc">
                              <MapPin size={10} /> {e.location}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {activeEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="ttcal__modalOverlay"
            onClick={() => setActiveEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="ttcal__modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ttcal__modal-header">
                <div className={`ttcal__modal-badge ttcal__event--${eventColor(activeEvent)}`}>
                  {getEventIcon(activeEvent)}
                  <span>{activeEvent.type || "Event"}</span>
                </div>
                <button className="ttcal__modal-close" onClick={() => setActiveEvent(null)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="ttcal__modal-body">
                <h3 className="ttcal__modal-title">{activeEvent.title}</h3>
                <div className="ttcal__modal-info">
                  <div className="ttcal__info-item">
                    <Clock size={18} />
                    <div>
                      <div className="ttcal__info-label">Time</div>
                      <div className="ttcal__info-value">
                        {new Date(activeEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(activeEvent.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  
                  {activeEvent.location && (
                    <div className="ttcal__info-item">
                      <MapPin size={18} />
                      <div>
                        <div className="ttcal__info-label">Location</div>
                        <div className="ttcal__info-value">{activeEvent.location}</div>
                      </div>
                    </div>
                  )}

                  <div className="ttcal__info-item">
                    <CalendarIcon size={18} />
                    <div>
                      <div className="ttcal__info-label">Date</div>
                      <div className="ttcal__info-value">
                        {new Date(activeEvent.start).toLocaleDateString(undefined, { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

