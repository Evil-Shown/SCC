import { useEffect, useMemo, useState } from "react";
import "../../styles/TimetableEditor.css";

const dayOptions = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" }
];

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function minutesToTimeValue(minutes) {
  const m = clamp(Number(minutes) || 0, 0, 24 * 60 - 1);
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function timeValueToMinutes(v) {
  const s = String(v || "");
  const [h, m] = s.split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return clamp(h * 60 + m, 0, 24 * 60 - 1);
}

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

export default function SlotEditorModal({
  open,
  mode = "edit", // edit | create
  slot,
  modules = [],
  resources = [],
  allowedDays = [1, 2, 3, 4, 5],
  onCancel,
  onSave,
  onDelete
}) {
  const initial = useMemo(() => {
    if (mode === "create") {
      return {
        dayOfWeek: allowedDays[0] || 1,
        startMinute: 8 * 60,
        durationHours: 1,
        moduleId: modules[0]?._id || "",
        resourceId: resources[0]?._id || ""
      };
    }
    return {
      dayOfWeek: Number(slot?.dayOfWeek) || 1,
      startMinute: Number(slot?.startMinute) || 0,
      durationHours: minutesToHours(Number(slot?.durationMinutes) || 60),
      moduleId: slot?.module?._id || slot?.module || "",
      resourceId: slot?.resource?._id || slot?.resource || ""
    };
  }, [mode, slot, allowedDays, modules, resources]);

  const [form, setForm] = useState(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  if (!open) return null;

  const days = dayOptions.filter((d) => allowedDays.includes(d.value));

  const validate = () => {
    if (!form.moduleId) return "Select a module";
    if (!form.resourceId) return "Select a resource";
    if (!allowedDays.includes(Number(form.dayOfWeek))) return "Invalid day";
    if (!Number.isFinite(Number(form.startMinute))) return "Invalid start time";
    if (!Number.isFinite(Number(form.durationHours)) || Number(form.durationHours) < 0.5) return "Invalid duration";
    return null;
  };

  const err = validate();

  return (
    <div
      className="tt-slot-modal__overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div className="tt-slot-modal">
        <div className="tt-slot-modal__header">
          <div className="tt-slot-modal__title">{mode === "create" ? "Add slot" : "Edit slot"}</div>
          <button className="tt-btn tt-btn-outline tt-btn-sm" onClick={onCancel}>Close</button>
        </div>

        <div className="tt-slot-modal__grid">
          <div className="tt-form-group">
            <label className="tt-label">Day</label>
            <select className="tt-select" value={form.dayOfWeek} onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: Number(e.target.value) }))}>
              {days.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="tt-form-group">
            <label className="tt-label">Start time</label>
            <input
              className="tt-input"
              type="time"
              step={1800}
              value={minutesToTimeValue(form.startMinute)}
              onChange={(e) => setForm((p) => ({ ...p, startMinute: timeValueToMinutes(e.target.value) }))}
            />
          </div>
          <div className="tt-form-group">
            <label className="tt-label">Duration (hours)</label>
            <input
              className="tt-input"
              type="number"
              min={0.5}
              step={0.5}
              value={form.durationHours}
              onChange={(e) => setForm((p) => ({ ...p, durationHours: clamp(Number(e.target.value), 0.5, 24) }))}
            />
          </div>
          <div className="tt-form-group">
            <label className="tt-label">Module</label>
            <select className="tt-select" value={form.moduleId} onChange={(e) => setForm((p) => ({ ...p, moduleId: e.target.value }))}>
              <option value="">Select…</option>
              {modules.map((m) => (
                <option key={m._id} value={m._id}>{m.code} — {m.name}</option>
              ))}
            </select>
          </div>
          <div className="tt-form-group tt-slot-modal__full">
            <label className="tt-label">Resource (hall/lab)</label>
            <select className="tt-select" value={form.resourceId} onChange={(e) => setForm((p) => ({ ...p, resourceId: e.target.value }))}>
              <option value="">Select…</option>
              {resources.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}{r.location ? ` — ${r.location}` : ""} ({r.resourceType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {err && <div className="tt-alert tt-alert-warning" style={{ marginTop: 12 }}><span>{err}</span></div>}

        <div className="tt-slot-modal__footer">
          {mode === "edit" ? (
            <button className="tt-btn tt-btn-danger" onClick={() => onDelete?.(slot)} disabled={!slot?._id}>
              Delete slot
            </button>
          ) : (
            <span />
          )}

          <div className="tt-slot-modal__actions">
            <button className="tt-btn tt-btn-outline" onClick={onCancel}>Cancel</button>
            <button
              className="tt-btn tt-btn-primary"
              onClick={() => onSave?.({ ...form, durationMinutes: hoursToMinutes(form.durationHours) })}
              disabled={!!err}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

