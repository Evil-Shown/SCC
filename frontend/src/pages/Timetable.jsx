import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import { useTheme } from "../context/ThemeContext";
import {
  Calendar,
  Brain,
  Plus,
  Sparkles,
  Clock,
  AlertCircle,
  RefreshCw,
  Trash2,
  Home as HomeIcon,
  GraduationCap,
  LayoutDashboard,
  BookMarked,
  Video,
  Users,
  LogOut,
  Lightbulb,
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import {
  createRawTimetable,
  generateOptimizedTimetable,
  getUserTimetable,
  getGoogleAuthUrl,
  getGoogleCalendarStatus,
  getGoogleCalendarEvents,
  aiTimetableChat,
  importTimetableFromFile,
  deleteUserTimetable,
  clearOptimizedSchedule
} from "../services/timetableService";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import WeekTimetableCalendar from "../components/WeekTimetableCalendar";
import NotificationBell from "../components/NotificationBell";
import { confirmAction } from "../utils/toast";
import "../styles/Timetable.css";
import "../styles/TimetableEditor.css";
import "../styles/TimetablePageUiverse.css";


function toDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function buildStudySuggestions(universitySchedule = [], optimizedSchedule = []) {
  const asDate = (v) => new Date(v);
  const studyBlocks = (optimizedSchedule || []).filter((e) => {
    if (!e) return false;
    const t = String(e.type || "").toLowerCase();
    const title = String(e.title || "").toLowerCase();
    return t === "study" || title.includes("work plan") || title.includes("study");
  });

  const formatSlot = (start, end) => {
    const day = start.toLocaleDateString(undefined, { weekday: "short" });
    const st = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const et = end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${day} ${st} – ${et}`;
  };

  if (studyBlocks.length > 0) {
    return studyBlocks
      .slice(0, 8)
      .map((b) => {
        const s = asDate(b.start);
        const e = asDate(b.end);
        const subject = b.subjectCode || b.title?.split(" - ")[0] || "this subject";
        return { slot: formatSlot(s, e), subject };
      });
  }

  const uni = (universitySchedule || [])
    .map((e) => ({ ...e, _start: asDate(e.start), _end: asDate(e.end) }))
    .filter((e) => !Number.isNaN(e._start.getTime()) && !Number.isNaN(e._end.getTime()) && e._end > e._start);

  if (uni.length === 0) return [];

  const dayMap = new Map();
  for (const e of uni) {
    const key = toDayKey(e._start);
    if (!dayMap.has(key)) dayMap.set(key, []);
    dayMap.get(key).push(e);
  }

  const suggestions = [];
  for (const events of dayMap.values()) {
    events.sort((a, b) => a._start - b._start);
    const dayDate = new Date(events[0]._start);

    const windowStart = new Date(dayDate);
    windowStart.setHours(18, 0, 0, 0);
    const windowEnd = new Date(dayDate);
    windowEnd.setHours(22, 0, 0, 0);

    let slotStart = new Date(windowStart);
    for (const evt of events) {
      if (evt._end <= slotStart) continue;
      if (evt._start <= slotStart && evt._end > slotStart) {
        slotStart = new Date(evt._end);
      }
    }

    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotStart.getHours() + 2, slotStart.getMinutes(), 0, 0);
    if (slotStart >= windowStart && slotEnd <= windowEnd) {
      const subject = events[0].subjectCode || events[0].title || "next topic";
      suggestions.push({ slot: formatSlot(slotStart, slotEnd), subject });
    }
  }

  return suggestions.slice(0, 8);
}

const defaultPreferredStudyHours = {
  startHour: 6,
  endHour: 22
};

const Timetable = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const toDateTimeLocalValue = (value) => {
    if (!value) return "";
    if (typeof value === "string" && value.length === 16 && value.includes("T")) {
      return value;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deletingTimetable, setDeletingTimetable] = useState(false);
  const [clearingAiPlan, setClearingAiPlan] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [universitySchedule, setUniversitySchedule] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState({});
  const [preferredStudyHours, setPreferredStudyHours] = useState(defaultPreferredStudyHours);
  const [optimizedSchedule, setOptimizedSchedule] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEventsLoading, setGoogleEventsLoading] = useState(false);
  const [googleStatus, setGoogleStatus] = useState({ connected: false, lastSyncedAt: null });
  const [googleEvents, setGoogleEvents] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [hasSavedTimetableOnServer, setHasSavedTimetableOnServer] = useState(false);
  const [calendarMountKey, setCalendarMountKey] = useState(0);
  const timetableFetchGenRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated]);

  const navLinks = [
    { icon: <HomeIcon size={18} strokeWidth={2.3} />, label: "Home", path: "/" },
    { icon: <LayoutDashboard size={18} strokeWidth={2.3} />, label: "Dashboard", path: "/dashboard" },
    { icon: <GraduationCap size={18} strokeWidth={2.3} />, label: "Exam Mode", path: "/exam-mode" },
    { icon: <Brain size={18} strokeWidth={2.3} />, label: "Timetable", path: "/timetable", active: true },
    { icon: <BookMarked size={18} strokeWidth={2.3} />, label: "Notes", path: "/notes" },
    { icon: <Video size={18} strokeWidth={2.3} />, label: "Kuppi", path: "/kuppi" },
    { icon: <Users size={18} strokeWidth={2.3} />, label: "Groups", path: "/groups" },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const googleConnected = params.get("google_connected");
    const googleError = params.get("google_error");
    if (googleConnected === "1") {
      setSuccess("Google Calendar connected.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (googleError) {
      setError(`Google connection failed: ${googleError}`);
      window.history.replaceState({}, "", window.location.pathname);
    }

    const fetchTimetable = async () => {
      if (!user?._id) return;
      const gen = ++timetableFetchGenRef.current;
      try {
        setLoading(true);
        const data = await getUserTimetable(user._id);
        if (gen !== timetableFetchGenRef.current) return;
        setUniversitySchedule(data.universitySchedule || []);
        setOptimizedSchedule(data.optimizedSchedule || []);
        setHasSavedTimetableOnServer(true);
      } catch (err) {
        if (gen !== timetableFetchGenRef.current) return;
        if (err?.response?.status === 404) {
          setUniversitySchedule([]);
          setOptimizedSchedule([]);
          setHasSavedTimetableOnServer(false);
        }
      } finally {
        if (gen === timetableFetchGenRef.current) setLoading(false);
      }
    };

    const fetchGoogle = async () => {
      try {
        const status = await getGoogleCalendarStatus();
        setGoogleStatus(status);
        if (status.connected) {
          setGoogleEventsLoading(true);
          const { events } = await getGoogleCalendarEvents({ maxResults: 15 });
          setGoogleEvents(events || []);
        } else {
          setGoogleEvents([]);
        }
      } catch {
        // ignore
      } finally {
        setGoogleEventsLoading(false);
      }
    };

    fetchTimetable();
    fetchGoogle();
  }, [isAuthenticated, navigate, user?._id]);

  const handleConnectGoogle = async () => {
    setError("");
    setSuccess("");
    try {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Please login again to connect Google Calendar.");
        navigate("/login");
        return;
      }
      setGoogleLoading(true);
      const { url } = await getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      setError(err.message || "Failed to start Google connection");
      setGoogleLoading(false);
    }
  };

  const handleAddEmptyEvent = () => {
    setUniversitySchedule((prev) => [
      ...prev,
      { title: "", subjectCode: "", type: "lecture", start: "", end: "", location: "" }
    ]);
  };

  const handleRemoveEvent = async (index) => {
    setError("");
    setSuccess("");
    const nextSchedule = universitySchedule.filter((_, i) => i !== index);
    setUniversitySchedule(nextSchedule);
    if (!hasSavedTimetableOnServer) return;
    try {
      setSaving(true);
      if (nextSchedule.length === 0) {
        await deleteUserTimetable();
        setOptimizedSchedule([]);
        setConflicts([]);
        setHasSavedTimetableOnServer(false);
        setCalendarMountKey((k) => k + 1);
        setSuccess("Last row removed. SCC timetable deleted.");
        return;
      }
      const normalizedSchedule = nextSchedule
        .filter((e) => e.title && e.start && e.end)
        .map((e) => ({ ...e, start: new Date(e.start).toISOString(), end: new Date(e.end).toISOString() }));
      const { timetable, conflicts: foundConflicts = [], hasConflicts } =
        await createRawTimetable(normalizedSchedule, { difficultyLevels, preferredStudyHours });
      setUniversitySchedule(timetable.universitySchedule || []);
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      setSuccess(hasConflicts ? "Row removed. Some overlaps remain." : "Row removed and timetable updated.");
    } catch (err) {
      setError(err.message || "Failed to persist row removal");
      if (user?._id) {
        try {
          const data = await getUserTimetable(user._id);
          setUniversitySchedule(data.universitySchedule || []);
          setOptimizedSchedule(data.optimizedSchedule || []);
          setHasSavedTimetableOnServer(true);
        } catch {
          setHasSavedTimetableOnServer(false);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEventField = (index, field, value) => {
    setUniversitySchedule((prev) =>
      prev.map((event, i) => i === index ? { ...event, [field]: value } : event)
    );
  };

  const handleChangeDifficulty = (subjectCode, value) => {
    setDifficultyLevels((prev) => ({ ...prev, [subjectCode]: value }));
  };

  const handleDeleteEntireTimetable = async () => {
    const confirmed = await confirmAction(
      "Remove your SCC timetable from this app? This deletes university + AI data in Smart Campus Companion. If Google is connected with the latest permissions, SCC will also try to delete the events it previously synced to your Google Calendar (not your other personal events).",
      { confirmText: "Delete SCC timetable", cancelText: "Cancel" }
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    setConflicts([]);
    timetableFetchGenRef.current += 1;
    setUniversitySchedule([]);
    setOptimizedSchedule([]);
    setDifficultyLevels({});
    setPreferredStudyHours({ ...defaultPreferredStudyHours });
    setImportFile(null);
    setAiPrompt("");
    setHasSavedTimetableOnServer(false);
    setCalendarMountKey((k) => k + 1);

    try {
      setDeletingTimetable(true);
      const res = await deleteUserTimetable();
      const deleted = res?.data?.deletedCount ?? 0;
      const gRemoved = res?.data?.googleEventsRemoved ?? 0;
      const gAttempted = res?.data?.googleEventsRemovalAttempted ?? 0;
      const googlePart = gAttempted > 0
        ? ` Removed ${gRemoved} SCC-synced event(s) from Google Calendar (${gAttempted} tracked).`
        : "";
      setSuccess(deleted > 0
        ? `SCC timetable removed (university + AI plan).${googlePart}`
        : `SCC timetable cleared. (Server had nothing to delete — UI was reset.)${googlePart}`
      );
    } catch (err) {
      setError(err.message || "Failed to delete timetable");
      if (user?._id) {
        try {
          const data = await getUserTimetable(user._id);
          setUniversitySchedule(data.universitySchedule || []);
          setOptimizedSchedule(data.optimizedSchedule || []);
          setHasSavedTimetableOnServer(true);
        } catch {
          setHasSavedTimetableOnServer(false);
        }
      }
    } finally {
      setDeletingTimetable(false);
    }
  };

  const handleClearAiGeneratedPlan = async () => {
    const confirmed = await confirmAction(
      "Remove only your AI / optimized plan? Your editable university timetable stays in SCC. If Google is connected, SCC will also try to remove the events it previously synced from that plan.",
      { confirmText: "Remove AI plan only", cancelText: "Cancel" }
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    setConflicts([]);
    const prevOptimized = optimizedSchedule;
    setOptimizedSchedule([]);
    setCalendarMountKey((k) => k + 1);

    try {
      setClearingAiPlan(true);
      const payload = await clearOptimizedSchedule();
      const gRemoved = payload?.googleEventsRemoved ?? 0;
      const gAttempted = payload?.googleEventsRemovalAttempted ?? 0;
      const googlePart = gAttempted > 0
        ? ` Removed ${gRemoved} SCC-synced event(s) from Google (${gAttempted} tracked).`
        : "";
      setSuccess(`AI / optimized plan removed. University timetable unchanged.${googlePart}`);
    } catch (err) {
      const st = err?.response?.status;
      if (st === 404) {
        setSuccess("Nothing saved on the server yet — the generated plan was cleared from this page.");
      } else {
        setError(err.message || "Failed to remove AI plan");
        setOptimizedSchedule(prevOptimized);
      }
    } finally {
      setClearingAiPlan(false);
    }
  };

  const persistUniversityTimetable = async ({ isUpdate = false } = {}) => {
    setError("");
    setSuccess("");
    setConflicts([]);
    try {
      setSaving(true);
      const normalizedSchedule = universitySchedule
        .filter((e) => e.title && e.start && e.end)
        .map((e) => ({ ...e, start: new Date(e.start).toISOString(), end: new Date(e.end).toISOString() }));
      if (normalizedSchedule.length === 0) {
        setError("Add at least one complete row (title, start, end) before saving.");
        return;
      }
      const { timetable, conflicts: foundConflicts = [], hasConflicts } =
        await createRawTimetable(normalizedSchedule, { difficultyLevels, preferredStudyHours });
      setUniversitySchedule(timetable.universitySchedule || []);
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      if (isUpdate) {
        setSuccess(hasConflicts
          ? "Timetable updated and optimized plan regenerated. Some overlaps need review."
          : "Timetable updated and optimized plan generated.");
      } else {
        setSuccess(hasConflicts
          ? "Timetable saved and optimized plan generated. Some overlaps need review."
          : "Timetable saved and optimized plan generated.");
      }
    } catch (err) {
      setError(err.message || "Failed to save timetable");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateOptimized = async () => {
    setError("");
    setSuccess("");
    setConflicts([]);
    try {
      setGenerating(true);
      const { timetable, conflicts: foundConflicts = [], hasConflicts } =
        await generateOptimizedTimetable({ difficultyLevels, preferredStudyHours });
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      setSuccess(hasConflicts
        ? "Optimized timetable generated with some overlapping events to review."
        : "Optimized timetable generated.");
    } catch (err) {
      setError(err.message || "Failed to generate optimized timetable");
    } finally {
      setGenerating(false);
    }
  };

  const handleAiChatGenerate = async () => {
    setError("");
    setSuccess("");
    setConflicts([]);
    try {
      const normalizedUniversitySchedule = (universitySchedule || [])
        .filter((e) => e && e.title && e.start && e.end)
        .map((e) => ({
          title: e.title,
          subjectCode: e.subjectCode || "",
          type: e.type || "lecture",
          start: new Date(e.start).toISOString(),
          end: new Date(e.end).toISOString(),
          location: e.location || ""
        }));

      if (!aiPrompt.trim() && normalizedUniversitySchedule.length === 0) {
        setError("Please describe your classes or study plan for the AI.");
        return;
      }

      const effectivePrompt = aiPrompt.trim() ||
        "Generate a balanced study/work plan in my free time. Prioritize hard subjects first, avoid overload per day, and respect personal commitments if mentioned.";

      setAiLoading(true);
      const { timetable, conflicts: foundConflicts = [], hasConflicts } = await aiTimetableChat({
        message: effectivePrompt,
        universitySchedule: normalizedUniversitySchedule.length > 0 ? normalizedUniversitySchedule : undefined
      });
      setUniversitySchedule(timetable.universitySchedule || []);
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      setSuccess(hasConflicts
        ? "AI created an optimized timetable with some overlaps to review."
        : "AI created an optimized timetable for you.");
    } catch (err) {
      setError(err.message || "Failed to generate timetable from AI chat");
    } finally {
      setAiLoading(false);
    }
  };

  const handleImportTimetable = async () => {
    setError("");
    setSuccess("");
    setConflicts([]);
    if (!importFile) {
      setError("Please upload a timetable image or PDF.");
      return;
    }
    try {
      setImporting(true);
      const { timetable, conflicts: foundConflicts = [], hasConflicts } =
        await importTimetableFromFile({ file: importFile, prompt: aiPrompt });
      setUniversitySchedule(timetable.universitySchedule || []);
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setHasSavedTimetableOnServer(true);
      setSuccess(hasConflicts
        ? "Imported timetable + generated working plan (with study time)."
        : "Imported timetable + generated working plan.");
      setImportFile(null);
    } catch (err) {
      setError(err.message || "Failed to import timetable");
    } finally {
      setImporting(false);
    }
  };

  const hasTimetable = useMemo(
    () => universitySchedule.length > 0 || optimizedSchedule.length > 0,
    [universitySchedule.length, optimizedSchedule.length]
  );

  const studySuggestions = useMemo(
    () => buildStudySuggestions(universitySchedule, optimizedSchedule),
    [universitySchedule, optimizedSchedule]
  );
  const [activeTab, setActiveTab] = useState("planner"); // planner, visualizer, sync

  if (!user) return <LoadingSpinner text="Loading timetable..." />;

  const isPlanner = activeTab === "planner";
  const isVisualizer = activeTab === "visualizer";
  const isSync = activeTab === "sync";

  return (
    <div className="tt-root" data-theme={theme}>
      <div className="tt-canvas" />

      <main className="tt-main">
        {/* TOP BAR / BREADCRUMBS */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="tt-topbar"
        >
          <div className="tt-topbar__left">
            <button className="tt-back-btn" onClick={() => navigate("/dashboard")} title="Go Back">
              <ArrowLeft size={18} />
            </button>
            <div className="tt-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <ChevronRight size={14} />
              <span className="active">Timetable & Strategy</span>
            </div>
          </div>

          <div className="tt-status-pill">
            <div className="tt-status-dot" />
            <span>AI ENGINE ONLINE</span>
          </div>
        </motion.div>

        {/* HERO SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="tt-hero"
        >
          <div className="tt-hero__content">
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.3 }}
              className="tt-hero__tag"
            >
              Academic Operations
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="tt-hero__title"
            >
              Smart Strategy Matrix
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="tt-hero__desc"
            >
              Orchestrate your academic trajectory with our <strong>Neural Strategy Engine</strong>. 
              Input your constraints, calibrate subject difficulty, and deploy a high-efficiency 
              study plan synchronized across your ecosystem.
            </motion.p>
          </div>

          <div className="tt-stats">
            {[
              { val: universitySchedule.length, lbl: "Core Lectures" },
              { val: optimizedSchedule.filter(e => {
                  const t = String(e?.type || "").toLowerCase();
                  return t === "study" || String(e?.title || "").toLowerCase().includes("study");
                }).length, lbl: "Study Blocks" },
              { val: conflicts.length, lbl: "Conflicts" }
            ].map((stat, idx) => (
              <motion.div 
                key={stat.lbl}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + (idx * 0.1) }}
                className="tt-stat"
              >
                <div className="tt-stat__val">{stat.val}</div>
                <div className="tt-stat__lbl">{stat.lbl}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ALERTS */}
        {error && (
          <div className="tt-alert tt-alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="tt-alert tt-alert-success">
            <Sparkles size={20} />
            <span>{success}</span>
          </div>
        )}
        {conflicts.length > 0 && (
          <div className="tt-alert tt-alert-warning">
            <AlertCircle size={20} />
            <span>
              Detected {conflicts.length} overlapping time slot{conflicts.length > 1 ? "s" : ""}. 
              Calibrate your registry to avoid clashes.
            </span>
          </div>
        )}

        {/* TAB SWITCHER */}
        <nav className="tt-tabs">
          <button className={`tt-tab ${isPlanner ? "active" : ""}`} onClick={() => setActiveTab("planner")}>
            <Brain size={18} />
            <span>Strategy Planner</span>
          </button>
          <button className={`tt-tab ${isVisualizer ? "active" : ""}`} onClick={() => setActiveTab("visualizer")}>
            <Calendar size={18} />
            <span>Visual Matrix</span>
          </button>
          <button className={`tt-tab ${isSync ? "active" : ""}`} onClick={() => setActiveTab("sync")}>
            <RefreshCw size={18} />
            <span>Ecosystem Sync</span>
          </button>
        </nav>

        {/* PANEL: PLANNER */}
        {isPlanner && (
          <div className="tt-panel tt-planner-grid">
            <aside className="tt-planner-sidebar">
              {/* SMART STRATEGY ENGINE CARD */}
              <div className="tt-card" style={{ marginBottom: "2rem" }}>
                <h3 className="tt-card__title">
                  <Sparkles size={20} />
                  Smart Strategy Engine
                </h3>
                <p className="tt-card__desc">
                  Input your constraints or upload a timetable image. The AI will architect 
                  an optimized plan prioritizing critical subjects.
                </p>

                <div className="tt-form-group">
                  <label className="tt-label">Strategic Prompt</label>
                  <textarea
                    className="tt-textarea"
                    rows={4}
                    placeholder="e.g. I have gym Mon/Wed/Fri 6–7 pm. Prioritize DBMS. Build a balanced study plan."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                </div>

                <div className="tt-form-group">
                  <label className="tt-label">OCR Registry (File Upload)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="tt-input"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                  {importFile && <p className="tt-label" style={{ color: "var(--tt-accent)", marginTop: "0.5rem" }}>File: {importFile.name}</p>}
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                  <button
                    className={`tt-btn tt-btn-primary ${(aiLoading || importing) ? "loading" : ""}`}
                    onClick={importFile ? handleImportTimetable : handleAiChatGenerate}
                    disabled={aiLoading || importing}
                    style={{ flex: 1 }}
                  >
                    <Sparkles size={16} />
                    {importing ? "Importing..." : aiLoading ? "Generating..." : "Generate Matrix"}
                  </button>
                </div>
              </div>

              {/* NEURAL RECOMMENDATIONS */}
              <div className="tt-card">
                <h3 className="tt-card__title">
                  <Lightbulb size={20} />
                  Neural Advisories
                </h3>
                <p className="tt-card__desc">Derived from your current temporal availability.</p>
                
                {studySuggestions.length === 0 ? (
                  <EmptyState title="No advisories" description="Initialize your registry to generate vectors." />
                ) : (
                  <div className="tt-recs">
                    {studySuggestions.map((item, idx) => (
                      <div key={idx} className="tt-rec">
                        <div className="tt-rec__type">Vector {idx + 1}</div>
                        <div className="tt-rec__slot">{item.slot}</div>
                        <div className="tt-rec__subj">Focus: {item.subject}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            <section className="tt-planner-main">
              {/* UNIVERSITY REGISTRY BOARD */}
              <div className="tt-card tt-card--full">
                <div className="tt-card__header">
                  <div className="tt-card__header-info">
                    <h3 className="tt-card__title">
                      <LayoutDashboard size={20} />
                      University Registry
                    </h3>
                    <p className="tt-card__desc">Calibrate your core lecture data here. Recalculates AI plan on change.</p>
                  </div>
                  <div className="tt-card__actions">
                    <button className="tt-btn tt-btn-outline tt-btn-sm" onClick={handleAddEmptyEvent}>
                      <Plus size={16} /> Add Block
                    </button>
                    <button
                      className="tt-btn tt-btn-primary tt-btn-sm"
                      onClick={() => persistUniversityTimetable({ isUpdate: true })}
                      disabled={saving || universitySchedule.length === 0}
                    >
                      <RefreshCw size={16} /> {saving ? "Saving..." : "Update"}
                    </button>
                  </div>
                </div>

                {universitySchedule.length === 0 ? (
                  <EmptyState title="Registry Empty" description="Add your first subject block to initialize." />
                ) : (
                  <div className="tt-editor-table-wrap">
                    <table className="tt-editor-table">
                      <thead>
                        <tr>
                          <th>Subject Title</th>
                          <th>ID/Code</th>
                          <th>Start Time</th>
                          <th>End Time</th>
                          <th>Difficulty</th>
                          <th style={{ width: '80px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {universitySchedule.map((event, index) => (
                          <tr key={index} className="tt-editor-table-row">
                            <td>
                              <input
                                className="tt-input"
                                value={event.title}
                                onChange={(e) => handleChangeEventField(index, "title", e.target.value)}
                                placeholder="e.g. Physics II"
                              />
                            </td>
                            <td>
                              <input
                                className="tt-input"
                                value={event.subjectCode}
                                onChange={(e) => handleChangeEventField(index, "subjectCode", e.target.value)}
                                placeholder="PHYS101"
                              />
                            </td>
                            <td>
                              <input
                                type="datetime-local"
                                className="tt-input"
                                value={toDateTimeLocalValue(event.start)}
                                onChange={(e) => handleChangeEventField(index, "start", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="datetime-local"
                                className="tt-input"
                                value={toDateTimeLocalValue(event.end)}
                                onChange={(e) => handleChangeEventField(index, "end", e.target.value)}
                              />
                            </td>
                            <td>
                              <select
                                className="tt-select"
                                value={difficultyLevels[event.subjectCode || event.title] || "medium"}
                                onChange={(e) => handleChangeDifficulty(event.subjectCode || event.title, e.target.value)}
                              >
                                <option value="easy">Level: Easy</option>
                                <option value="medium">Level: Medium</option>
                                <option value="hard">Level: Hard</option>
                              </select>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button className="tt-btn tt-btn-danger tt-btn-sm" onClick={() => handleRemoveEvent(index)} title="Remove Block">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="tt-card__footer">
                  <button className="tt-btn tt-btn-danger" onClick={handleDeleteEntireTimetable} disabled={deletingTimetable}>
                    <Trash2 size={16} /> Delete Entire Registry
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* PANEL: VISUALIZER */}
        {isVisualizer && (
          <div className="tt-panel">
            <div className="tt-card tt-card--calendar">
              <div className="tt-card__header">
                <div className="tt-card__header-info">
                  <h3 className="tt-card__title tt-card__title--large">
                    <Calendar size={28} />
                    Temporal Projection Array
                  </h3>
                  <p className="tt-card__desc">Visualizing synchronized lecture and neural study blocks.</p>
                </div>
                {hasTimetable && optimizedSchedule.length > 0 && (
                  <div className="tt-card__actions">
                    <button className="tt-btn tt-btn-danger" onClick={handleClearAiGeneratedPlan}>
                      <Trash2 size={16} /> Purge AI Plan
                    </button>
                  </div>
                )}
              </div>

              {!hasTimetable ? (
                <EmptyState title="No projections found" description="Initialize your registry to generate vectors." />
              ) : (
                <WeekTimetableCalendar
                  key={calendarMountKey}
                  title="Temporal Projection"
                  events={optimizedSchedule.length > 0 ? optimizedSchedule : universitySchedule}
                  minHour={6}
                  maxHour={22}
                />
              )}
            </div>
          </div>
        )}

        {/* PANEL: SYNC */}
        {isSync && (
          <div className="tt-panel">
            <div className="tt-card tt-google-hero">
              <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                <div className="tt-google-icon" style={{ margin: "0 auto 2rem" }}>
                  <svg viewBox="0 0 24 24" width="80" height="80">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <h2 className="tt-hero__title" style={{ fontSize: "2.5rem", marginBottom: "1.5rem" }}>Google Ecosystem Sync</h2>
                <p className="tt-hero__desc" style={{ marginBottom: "2.5rem" }}>
                  Establish a secure tunnel to your Google Calendar. Neural plans will synchronize automatically 
                  upon commitment, creating dedicated temporal entries in your external array.
                </p>
                
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                  <button className="tt-btn tt-btn-primary" onClick={handleConnectGoogle} disabled={googleLoading}>
                    {googleStatus.connected ? "Reconnect Ecosystem" : "Establish Link"}
                  </button>
                  <div className={`tt-status-pill ${googleStatus.connected ? "success" : "warning"}`} style={{ padding: "0 1.5rem" }}>
                    <div className="tt-status-dot" style={{ background: googleStatus.connected ? "var(--tt-success)" : "var(--tt-warning)" }} />
                    <span style={{ color: googleStatus.connected ? "var(--tt-success)" : "var(--tt-warning)" }}>
                      {googleStatus.connected ? "LINK ESTABLISHED" : "LINK OFFLINE"}
                    </span>
                  </div>
                </div>
              </div>

              {googleStatus.connected && (
                <div style={{ marginTop: "5rem", borderTop: "1px solid var(--tt-border)", paddingTop: "4rem" }}>
                  <h3 className="tt-card__title" style={{ marginBottom: "2rem", justifyContent: "center" }}>
                    <Calendar size={20} />
                    Active Ecosystem Projection
                  </h3>
                  <div className="google-iframe-wrap" style={{ borderRadius: "24px", overflow: "hidden", border: "1px solid var(--tt-border)", boxShadow: "var(--tt-shadow)" }}>
                    <iframe
                      title="Google Calendar"
                      src={import.meta.env.VITE_GOOGLE_CALENDAR_EMBED_URL || "https://calendar.google.com/calendar/embed?mode=WEEK&wkst=1&bgcolor=%23ffffff&ctz=UTC"}
                      style={{ width: "100%", height: 600, border: 0, display: "block" }}
                      loading="lazy"
                    />
                  </div>

                  <div className="tt-google-events">
                    {googleEventsLoading ? (
                      <p className="tt-label">SCANNING EXTERNAL ARRAY...</p>
                    ) : googleEvents.length === 0 ? (
                      <EmptyState title="Array Clear" description="No external events detected in this frequency." />
                    ) : (
                      googleEvents.map((e) => (
                        <div key={e.id} className="tt-rec" style={{ textAlign: "left" }}>
                          <div className="tt-rec__type">External Entry</div>
                          <div className="tt-rec__slot" style={{ fontSize: "1rem" }}>{e.summary}</div>
                          <div className="tt-rec__subj">
                            {e.start ? new Date(e.start).toLocaleString() : "—"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Timetable;