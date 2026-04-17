import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, Plus } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

import GridTimetable from "../components/timetable/GridTimetable";
import SlotEditorModal from "../components/timetable/SlotEditorModal";
import PdfExportButton from "../components/timetable/PdfExportButton";
import { sendAiMessage } from "../services/aiService";
import { listModules } from "../services/moduleService";
import { listResources } from "../services/resourceService";
import {
  addSlot,
  deleteSlot,
  getSemesterTimetable,
  updateSlot
} from "../services/semesterTimetableService";

import "../styles/Timetable.css";

function materializeSlot(slot) {
  const base = new Date(Date.UTC(2020, 0, 6, 0, 0, 0, 0)); // Monday
  const dayOffset = (Number(slot.dayOfWeek) || 1) - 1;
  const start = new Date(base);
  start.setUTCDate(base.getUTCDate() + dayOffset);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMinutes(Number(slot.startMinute) || 0);
  const end = new Date(start);
  end.setUTCMinutes(start.getUTCMinutes() + (Number(slot.durationMinutes) || 60));

  const moduleCode = slot?.labelSnapshot?.moduleCode || slot?.module?.code || "";
  const moduleName = slot?.labelSnapshot?.moduleName || slot?.module?.name || "Session";
  const title = moduleCode ? `${moduleCode} ${moduleName}`.trim() : moduleName;
  const location = slot?.labelSnapshot?.resourceLocation
    ? `${slot?.labelSnapshot?.resourceName} (${slot?.labelSnapshot?.resourceLocation})`
    : (slot?.labelSnapshot?.resourceName || "");

  const type = String(slot?.labelSnapshot?.sessionType || slot?.module?.sessionType || "").toLowerCase() || "lecture";
  return { title, subjectCode: moduleCode, type, start, end, location, metadata: { slotId: slot._id } };
}

export default function SemesterTimetableView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const userRole = useSelector((s) => s.auth.user?.role);
  const canGenerate = userRole === "teacher" || userRole === "admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timetable, setTimetable] = useState(null);
  const [slots, setSlots] = useState([]);
  const [modules, setModules] = useState([]);
  const [resources, setResources] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("edit");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");

  const refresh = async () => {
    const data = await getSemesterTimetable(id);
    setTimetable(data.timetable);
    setSlots(data.slots || []);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await refresh();
        const [mods, res] = await Promise.all([listModules(), listResources()]);
        setModules(mods || []);
        setResources(res || []);
      } catch (e) {
        setError(e.message || "Failed to load timetable");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const events = useMemo(() => slots.map(materializeSlot), [slots]);
  const allowedDays = useMemo(() => {
    const bt = timetable?.batchType;
    return bt === "WEEKEND" ? [6, 7] : [1, 2, 3, 4, 5];
  }, [timetable?.batchType]);
  const cfg = timetable?.generationConfig || {};

  const runAiOptimization = async () => {
    if (!timetable) return;
    setError("");
    setAiAdvice("");
    try {
      setAiLoading(true);
      const compactSlots = (slots || []).map((s) => ({
        moduleCode: s?.labelSnapshot?.moduleCode || s?.module?.code || "",
        moduleName: s?.labelSnapshot?.moduleName || s?.module?.name || "",
        sessionType: s?.labelSnapshot?.sessionType || s?.module?.sessionType || "",
        dayOfWeek: Number(s.dayOfWeek),
        startMinute: Number(s.startMinute),
        durationMinutes: Number(s.durationMinutes),
        resourceName: s?.labelSnapshot?.resourceName || ""
      }));

      const prompt = [
        "You are a university timetable optimizer.",
        "Analyze this timetable and return practical improvements.",
        "Focus on:",
        "1) conflict risks",
        "2) long idle gaps",
        "3) day-load balance",
        "4) room usage optimization",
        "5) lecturer/student fatigue (too many back-to-back sessions)",
        "",
        "Return concise markdown with:",
        "- Overall quality score out of 10",
        "- Top issues (max 5)",
        "- Suggested changes (max 8, specific with day/time shifts)",
        "",
        "Timetable metadata:",
        JSON.stringify({
          year: timetable.year,
          semester: timetable.semester,
          batchType: timetable.batchType,
          generationConfig: cfg
        }),
        "",
        "Slots:",
        JSON.stringify(compactSlots)
      ].join("\n");

      const reply = await sendAiMessage({ message: prompt });
      setAiAdvice(reply || "No AI suggestions available.");
    } catch (e) {
      setError(e.message || "Failed to get AI optimization suggestions");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="tt-root" data-theme={theme}>
      <main className="tt-main">
        <div className="tt-topbar">
          <div className="tt-topbar__left">
            <button className="tt-back-btn" onClick={() => navigate("/timetable/search")} title="Back">
              <ArrowLeft size={18} />
            </button>
            <div className="tt-breadcrumb">
              <Link to="/timetable">Timetable</Link>
              <span style={{ opacity: 0.7, margin: "0 0.4rem" }}>/</span>
              <Link to="/timetable/search">Search</Link>
              <span style={{ opacity: 0.7, margin: "0 0.4rem" }}>/</span>
              <span className="active">View</span>
            </div>
          </div>
          <div className="tt-status-pill">
            <span className="tt-status-dot" />
            <span>University Timetable System</span>
          </div>
        </div>

        {error && <div className="tt-alert tt-alert-error"><span>{error}</span></div>}

        <section className="tt-panel">
          <div className="tt-card tt-card--calendar">
            <div className="tt-card__header">
              <div className="tt-card__header-info">
                <h3 className="tt-card__title tt-card__title--large">Semester timetable</h3>
                <p className="tt-card__desc">
                  {timetable ? `Year ${timetable.year} · Semester ${timetable.semester} · ${timetable.batchType}` : "—"}
                </p>
              </div>
              <div className="tt-card__actions">
                <PdfExportButton timetable={timetable} slots={slots} days={allowedDays} />
                <button className="tt-btn tt-btn-outline" onClick={runAiOptimization} disabled={loading || aiLoading}>
                  {aiLoading ? "AI analyzing..." : "AI Improve"}
                </button>
                <button
                  className="tt-btn tt-btn-outline"
                  onClick={() => {
                    setEditorMode("create");
                    setSelectedSlot(null);
                    setEditorOpen(true);
                  }}
                  disabled={loading}
                >
                  <Plus size={16} /> Add slot
                </button>
                {canGenerate && (
                  <button className="tt-btn tt-btn-outline" onClick={() => navigate("/timetable/generate")}>
                    Generate again
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <p className="tt-label">Loading…</p>
            ) : (
              <>
                <GridTimetable
                  slots={slots}
                  days={allowedDays}
                  dayStartMinutes={Number(cfg.dayStartMinutes ?? 8 * 60)}
                  dayEndMinutes={Number(cfg.dayEndMinutes ?? 18 * 60)}
                  stepMinutes={Number(cfg.slotStepMinutes ?? 30)}
                  onSelectSlot={(s) => {
                    setEditorMode("edit");
                    setSelectedSlot(s);
                    setEditorOpen(true);
                  }}
                />
                {aiAdvice && (
                  <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: 12, border: "1px solid var(--tt-border)", whiteSpace: "pre-wrap" }}>
                    {aiAdvice}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <SlotEditorModal
          open={editorOpen}
          mode={editorMode}
          slot={selectedSlot}
          modules={modules}
          resources={resources}
          allowedDays={allowedDays}
          onCancel={() => setEditorOpen(false)}
          onSave={async (form) => {
            setError("");
            try {
              if (editorMode === "create") {
                await addSlot(id, form);
              } else if (selectedSlot?._id) {
                await updateSlot(id, selectedSlot._id, form);
              }
              await refresh();
              setEditorOpen(false);
            } catch (e) {
              setError(e.message || "Failed to save slot");
            }
          }}
          onDelete={async (slotToDelete) => {
            setError("");
            try {
              await deleteSlot(id, slotToDelete._id);
              await refresh();
              setEditorOpen(false);
            } catch (e) {
              setError(e.message || "Failed to delete slot");
            }
          }}
        />
      </main>
    </div>
  );
}

