import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Wand2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

import { generateSemesterTimetable } from "../services/semesterTimetableService";

import "../styles/Timetable.css";

function minutesToTimeValue(minutes) {
  const m = Math.max(0, Math.min(24 * 60 - 1, Number(minutes) || 0));
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function timeValueToMinutes(v) {
  const [h, m] = String(v || "").split(":").map((n) => Number(n));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return (h * 60) + m;
}

export default function GenerateTimetable() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [batchType, setBatchType] = useState("WEEKDAY");
  const [dayStartMinutes, setDayStartMinutes] = useState(8 * 60);
  const [dayEndMinutes, setDayEndMinutes] = useState(18 * 60);
  const [slotStepMinutes, setSlotStepMinutes] = useState(30);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const doGenerate = async () => {
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      const data = await generateSemesterTimetable({
        year,
        semester,
        batchType,
        config: { dayStartMinutes, dayEndMinutes, slotStepMinutes }
      });
      if (batchType === "BOTH") {
        const weekdayId = data?.weekday?.timetable?._id;
        if (weekdayId) {
          setSuccess("Generated weekday + weekend timetables.");
          navigate(`/timetable/view/${weekdayId}`);
          return;
        }
      } else {
        const id = data?.timetable?._id;
        if (id) {
          setSuccess("Generated timetable.");
          navigate(`/timetable/view/${id}`);
          return;
        }
      }
      setSuccess("Generated.");
    } catch (e) {
      setError(e.message || "Failed to generate timetable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tt-root" data-theme={theme}>
      <main className="tt-main">
        <div className="tt-topbar">
          <div className="tt-topbar__left">
            <button className="tt-back-btn" onClick={() => navigate("/timetable")} title="Back">
              <ArrowLeft size={18} />
            </button>
            <div className="tt-breadcrumb">
              <Link to="/timetable">Timetable</Link>
              <span style={{ opacity: 0.7, margin: "0 0.4rem" }}>/</span>
              <span className="active">Generate</span>
            </div>
          </div>
          <div className="tt-flow-nav">
            <button className="tt-flow-nav__btn" type="button" onClick={() => navigate("/timetable/modules")}>
              <ArrowLeft size={16} />
              <span>Back: Modules</span>
            </button>
            <button className="tt-flow-nav__btn tt-flow-nav__btn--primary" type="button" onClick={() => navigate("/timetable/search")}>
              <span>Next: Search</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {error && <div className="tt-alert tt-alert-error"><span>{error}</span></div>}
        {success && <div className="tt-alert tt-alert-success"><span>{success}</span></div>}

        <section className="tt-panel">
          <div className="tt-card tt-card--full">
            <div className="tt-card__header">
              <div className="tt-card__header-info">
                <h3 className="tt-card__title">Generate semester timetable</h3>
                <p className="tt-card__desc">Uses your resources + modules. No dates required.</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              <div className="tt-form-group">
                <label className="tt-label">Academic year</label>
                <select id="generate-year" name="year" className="tt-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="tt-form-group">
                <label className="tt-label">Semester</label>
                <select id="generate-semester" name="semester" className="tt-select" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
                  {[1, 2].map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div className="tt-form-group">
                <label className="tt-label">Batch type</label>
                <select id="generate-batch-type" name="batchType" className="tt-select" value={batchType} onChange={(e) => setBatchType(e.target.value)}>
                  <option value="WEEKDAY">Weekday</option>
                  <option value="WEEKEND">Weekend</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>

              <div className="tt-form-group">
                <label className="tt-label">Day start time</label>
                <input id="generate-day-start" name="dayStartTime" className="tt-input" type="time" step={1800} value={minutesToTimeValue(dayStartMinutes)} onChange={(e) => setDayStartMinutes(timeValueToMinutes(e.target.value))} />
              </div>
              <div className="tt-form-group">
                <label className="tt-label">Day end time</label>
                <input id="generate-day-end" name="dayEndTime" className="tt-input" type="time" step={1800} value={minutesToTimeValue(dayEndMinutes)} onChange={(e) => setDayEndMinutes(timeValueToMinutes(e.target.value))} />
              </div>
              <div className="tt-form-group">
                <label className="tt-label">Slot interval (minutes)</label>
                <input id="generate-slot-step" name="slotStepMinutes" className="tt-input" type="number" min={5} max={240} step={5} value={slotStepMinutes} onChange={(e) => setSlotStepMinutes(Number(e.target.value))} />
              </div>
            </div>

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
              <button className="tt-btn tt-btn-primary" onClick={doGenerate} disabled={loading}>
                <Wand2 size={16} /> {loading ? "Generating…" : "Generate timetable"}
              </button>
              <button className="tt-btn tt-btn-outline" type="button" onClick={() => navigate("/timetable/search")}>
                Search existing
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

