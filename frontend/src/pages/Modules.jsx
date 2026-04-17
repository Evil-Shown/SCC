import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

import { createModule, deleteModule, listModules, updateModule } from "../services/moduleService";

import "../styles/Timetable.css";

const empty = {
  name: "",
  code: "",
  sessionType: "LECTURE",
  durationHours: 1,
  requiredRoomType: "LECTURE_HALL",
  year: 1,
  semester: 1,
  batchType: "BOTH",
  sessionsPerWeek: 1
};

function hoursToMinutes(hours) {
  const h = Number(hours);
  if (!Number.isFinite(h) || h <= 0) return 60;
  return Math.max(30, Math.round(h * 60));
}

function minutesToHours(minutes) {
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return 1;
  return Math.round((m / 60) * 100) / 100;
}

export default function Modules() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modules, setModules] = useState([]);
  const [form, setForm] = useState(empty);

  const refresh = async () => {
    const data = await listModules();
    setModules(data || []);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (e) {
        setError(e.message || "Failed to load modules");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onCreate = async () => {
    if (saving) return;
    setError("");
    setSuccess("");
    const normalizedName = form.name.trim();
    const normalizedCode = form.code.trim().toUpperCase();
    if (!normalizedName || !normalizedCode) {
      setError("Module name and code are required.");
      return;
    }
    const alreadyExists = modules.some(
      (m) =>
        String(m.code || "").toUpperCase() === normalizedCode &&
        String(m.sessionType || "").toUpperCase() === String(form.sessionType || "").toUpperCase()
    );
    if (alreadyExists) {
      setError(
        `Module code "${normalizedCode}" already exists for ${form.sessionType}. Use a different code or change session type.`
      );
      return;
    }
    try {
      setSaving(true);
      await createModule({
        ...form,
        name: normalizedName,
        code: normalizedCode,
        durationMinutes: hoursToMinutes(form.durationHours)
      });
      setForm(empty);
      await refresh();
      setSuccess("Module created.");
    } catch (e) {
      setError(e.message || "Failed to create module");
    } finally {
      setSaving(false);
    }
  };

  const onUpdateInline = async (id, patch) => {
    setError("");
    setSuccess("");
    try {
      await updateModule(id, patch);
      await refresh();
      setSuccess("Module updated.");
    } catch (e) {
      setError(e.message || "Failed to update module");
    }
  };

  const onDelete = async (id) => {
    setError("");
    setSuccess("");
    try {
      await deleteModule(id);
      await refresh();
      setSuccess("Module deleted.");
    } catch (e) {
      setError(e.message || "Failed to delete module");
    }
  };

  return (
    <div className="tt-root" data-theme={theme}>
      <main className="tt-main">
        <div className="tt-topbar">
          <div className="tt-topbar__left">
            <button className="tt-back-btn" onClick={() => navigate("/timetable")} title="Back to Timetable">
              <ArrowLeft size={18} />
            </button>
            <div className="tt-breadcrumb">
              <Link to="/timetable">Timetable</Link>
              <span style={{ opacity: 0.7, margin: "0 0.4rem" }}>/</span>
              <span className="active">Modules</span>
            </div>
          </div>
          <div className="tt-flow-nav">
            <button className="tt-flow-nav__btn" type="button" onClick={() => navigate("/timetable/resources")}>
              <ArrowLeft size={16} />
              <span>Back: Resources</span>
            </button>
            <button className="tt-flow-nav__btn tt-flow-nav__btn--primary" type="button" onClick={() => navigate("/timetable/generate")}>
              <span>Next: Generate</span>
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
                <h3 className="tt-card__title">Modules / Sessions</h3>
                <p className="tt-card__desc">Define lectures and labs (duration + room type + year/semester + batch).</p>
              </div>
            </div>

            <div className="tt-modules-form-grid">
              <div className="tt-form-group">
                <label className="tt-label">Module name</label>
                <input id="module-name" name="moduleName" className="tt-input" placeholder="e.g. Data Structures" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="tt-form-group">
                <label className="tt-label">Module code</label>
                <input id="module-code" name="moduleCode" className="tt-input" placeholder="e.g. CS101" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
              </div>
              <div className="tt-form-group">
                <label className="tt-label">Session type</label>
                <select id="session-type" name="sessionType" className="tt-select" value={form.sessionType} onChange={(e) => setForm((p) => ({ ...p, sessionType: e.target.value }))}>
                  <option value="LECTURE">Lecture</option>
                  <option value="LAB">Lab</option>
                </select>
              </div>
              <div className="tt-form-group">
                <label className="tt-label">Duration (hours)</label>
                <input
                  className="tt-input"
                  type="number"
                  id="duration-hours"
                  name="durationHours"
                  min={0.5}
                  step={0.5}
                  value={form.durationHours}
                  onChange={(e) => setForm((p) => ({ ...p, durationHours: Number(e.target.value) }))}
                />
              </div>
              <div className="tt-form-group">
                <label className="tt-label">Required room type</label>
                <select id="required-room-type" name="requiredRoomType" className="tt-select" value={form.requiredRoomType} onChange={(e) => setForm((p) => ({ ...p, requiredRoomType: e.target.value }))}>
                  <option value="LECTURE_HALL">Lecture hall</option>
                  <option value="LAB">Lab</option>
                </select>
              </div>
              <div className="tt-form-group">
                <label className="tt-label">Batch type</label>
                <select id="batch-type" name="batchType" className="tt-select" value={form.batchType} onChange={(e) => setForm((p) => ({ ...p, batchType: e.target.value }))}>
                  <option value="WEEKDAY">Weekday</option>
                  <option value="WEEKEND">Weekend</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
              <div className="tt-form-group">
                <label className="tt-label">Academic year</label>
                <select id="academic-year" name="year" className="tt-select" value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))}>
                  {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="tt-form-group">
                <label className="tt-label">Semester</label>
                <select id="module-semester" name="semester" className="tt-select" value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: Number(e.target.value) }))}>
                  {[1, 2].map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div className="tt-form-group">
                <label className="tt-label">Sessions per week</label>
                <input id="sessions-per-week" name="sessionsPerWeek" className="tt-input" type="number" min={1} max={10} value={form.sessionsPerWeek} onChange={(e) => setForm((p) => ({ ...p, sessionsPerWeek: Number(e.target.value) }))} />
              </div>
              <div className="tt-modules-create-row">
                <button className="tt-btn tt-btn-primary tt-modules-create-btn" onClick={onCreate} disabled={saving}>
                  <Plus size={16} /> {saving ? "Saving…" : "Create module"}
                </button>
              </div>
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              {loading ? (
                <p className="tt-label">Loading…</p>
              ) : modules.length === 0 ? (
                <p className="tt-label">No modules yet.</p>
              ) : (
                <table className="tt-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Duration</th>
                      <th>Room</th>
                      <th>Year</th>
                      <th>Sem</th>
                      <th>Batch</th>
                      <th>Per week</th>
                      <th style={{ width: 80 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((m) => (
                      <tr key={m._id}>
                        <td>
                          <input className="tt-input" defaultValue={m.code} onBlur={(e) => e.target.value !== m.code && onUpdateInline(m._id, { code: e.target.value })} />
                        </td>
                        <td>
                          <input className="tt-input" defaultValue={m.name} onBlur={(e) => e.target.value !== m.name && onUpdateInline(m._id, { name: e.target.value })} />
                        </td>
                        <td>
                          <select className="tt-select" defaultValue={m.sessionType} onChange={(e) => onUpdateInline(m._id, { sessionType: e.target.value })}>
                            <option value="LECTURE">Lecture</option>
                            <option value="LAB">Lab</option>
                          </select>
                        </td>
                        <td>
                          <input
                            className="tt-input"
                            type="number"
                            min={0.5}
                            step={0.5}
                            defaultValue={minutesToHours(m.durationMinutes)}
                            onBlur={(e) => onUpdateInline(m._id, { durationMinutes: hoursToMinutes(e.target.value) })}
                          />
                        </td>
                        <td>
                          <select className="tt-select" defaultValue={m.requiredRoomType} onChange={(e) => onUpdateInline(m._id, { requiredRoomType: e.target.value })}>
                            <option value="LECTURE_HALL">Lecture hall</option>
                            <option value="LAB">Lab</option>
                          </select>
                        </td>
                        <td>
                          <input className="tt-input" type="number" min={1} max={4} defaultValue={m.year} onBlur={(e) => onUpdateInline(m._id, { year: Number(e.target.value) })} />
                        </td>
                        <td>
                          <input className="tt-input" type="number" defaultValue={m.semester} onBlur={(e) => onUpdateInline(m._id, { semester: Number(e.target.value) })} />
                        </td>
                        <td>
                          <select className="tt-select" defaultValue={m.batchType} onChange={(e) => onUpdateInline(m._id, { batchType: e.target.value })}>
                            <option value="WEEKDAY">Weekday</option>
                            <option value="WEEKEND">Weekend</option>
                            <option value="BOTH">Both</option>
                          </select>
                        </td>
                        <td>
                          <input className="tt-input" type="number" defaultValue={m.sessionsPerWeek} onBlur={(e) => onUpdateInline(m._id, { sessionsPerWeek: Number(e.target.value) })} />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button className="tt-btn tt-btn-danger tt-btn-sm" onClick={() => onDelete(m._id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

