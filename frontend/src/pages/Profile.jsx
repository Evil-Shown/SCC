import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { logout, fetchUserProfile, updateUserProfile, deleteUserAccount } from "../features/auth/authSlice";
import {
  BookMarked, Users, Calendar, GraduationCap, LogOut,
  Settings, User as UserIcon, Home as HomeIcon, Video, Activity,
  Shield, LayoutDashboard, Mail, MapPin, Github, Twitter, Linkedin,
  Edit3, Clock, Globe, Trash2, CheckCircle2, Archive, Sparkles, X,
  ChevronRight, AlertTriangle, ShieldAlert, ArrowLeft,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import "../styles/Dashboard.css";
import "../styles/Notifications.css";
import "../styles/Profile.css";
import { deleteKuppiPost, getMyKuppiLogs, updateKuppiPost } from "../services/kuppiService";
import { getMyNotes, updateNote as updateNoteById, deleteNote as deleteNoteById } from "../services/notesService";
import { confirmAction, notifyError, notifySuccess } from "../utils/toast";

const TABS = ["overview", "activity", "settings"];

/* ── Animated number counter ─────────────────────────────────────────── */
const Counter = ({ value }) => {
  return <span>{value}</span>;
};

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({ name: "", bio: "", location: "", website: "", github: "", twitter: "", linkedin: "", department: "", year: "", phone: "" });

  const [kuppiLogs, setKuppiLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState("");

  const [editingKuppi, setEditingKuppi] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [kuppiEditForm, setKuppiEditForm] = useState({ title: "", description: "", subject: "", eventDate: "", meetingLink: "" });
  const [noteEditForm, setNoteEditForm] = useState({ title: "", description: "", subject: "", onedriveLink: "", tags: "", year: "" });
  const [updatingKuppi, setUpdatingKuppi] = useState(false);
  const [updatingNote, setUpdatingNote] = useState(false);

  const navLinks = [
    { icon: <HomeIcon size={16} />, label: "Home", path: "/" },
    { icon: <LayoutDashboard size={16} />, label: "Dashboard", path: "/dashboard" },
    { icon: <BookMarked size={16} />, label: "Notes", path: "/notes" },
    { icon: <Video size={16} />, label: "Kuppi", path: "/kuppi" },
    { icon: <Users size={16} />, label: "Groups", path: "/groups" },
    { icon: <UserIcon size={16} />, label: "Profile", path: "/profile" },
  ];

  useEffect(() => { if (!isAuthenticated) navigate("/login"); }, [isAuthenticated, navigate]);
  useEffect(() => { if (isAuthenticated) dispatch(fetchUserProfile()); }, [dispatch, isAuthenticated]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && TABS.includes(t) && t !== activeTab) setActiveTab(t);
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", activeTab);
    setSearchParams(next, { replace: true });
  }, [activeTab]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLogsLoading(true);
    getMyKuppiLogs()
      .then((r) => setKuppiLogs(r.data || []))
      .catch((e) => setLogsError(e?.response?.data?.message || "Failed to load"))
      .finally(() => setLogsLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setNotesLoading(true);
    getMyNotes({ page: 1, limit: 100 })
      .then((r) => setNotes(r.data || []))
      .catch((e) => setNotesError(e?.response?.data?.message || "Failed to load notes"))
      .finally(() => setNotesLoading(false));
  }, [isAuthenticated]);

  const summary = useMemo(() => {
    const total = kuppiLogs.length;
    const active = kuppiLogs.filter((l) => !l.isArchived).length;
    const archived = kuppiLogs.filter((l) => l.isArchived).length;
    const upcoming = kuppiLogs.filter((l) => {
      const d = new Date(l.eventDate);
      return !isNaN(d.getTime()) && d > new Date();
    }).length;
    return { total, active, archived, upcoming };
  }, [kuppiLogs]);

  const recentLogs = useMemo(() =>
    [...kuppiLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3),
    [kuppiLogs]
  );

  const handleDelete = async (id) => {
    const ok = await confirmAction("Permanently delete this Kuppi log?", { confirmText: "Delete" });
    if (!ok) return;
    try {
      await deleteKuppiPost(id);
      setKuppiLogs((prev) => prev.filter((l) => l._id !== id));
      notifySuccess("Deleted");
    } catch (e) {
      notifyError(e?.response?.data?.message || "Delete failed");
    }
  };

  const toDateTimeLocal = (value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    const tz = date.getTimezoneOffset();
    const local = new Date(date.getTime() - tz * 60000);
    return local.toISOString().slice(0, 16);
  };

  const openKuppiEdit = (log) => {
    setEditingKuppi(log);
    setKuppiEditForm({
      title: log.title || "",
      description: log.description || "",
      subject: log.subject || "",
      eventDate: toDateTimeLocal(log.eventDate),
      meetingLink: log.meetingLink || "",
    });
  };

  const saveKuppiEdit = async (e) => {
    e.preventDefault();
    if (!editingKuppi) return;
    try {
      setUpdatingKuppi(true);
      const payload = {
        title: kuppiEditForm.title.trim(),
        description: kuppiEditForm.description.trim(),
        subject: kuppiEditForm.subject.trim(),
        eventDate: kuppiEditForm.eventDate,
        meetingLink: kuppiEditForm.meetingLink.trim(),
      };
      const res = await updateKuppiPost(editingKuppi._id, payload);
      const updated = res?.data;
      if (updated?._id) {
        setKuppiLogs((prev) => prev.map((l) => (l._id === updated._id ? updated : l)));
      }
      setEditingKuppi(null);
      notifySuccess("Kuppi session updated");
    } catch (e2) {
      notifyError(e2?.response?.data?.message || "Failed to update kuppi session");
    } finally {
      setUpdatingKuppi(false);
    }
  };

  const handleDeleteNote = async (id) => {
    const ok = await confirmAction("Permanently delete this note?", { confirmText: "Delete" });
    if (!ok) return;
    try {
      await deleteNoteById(id);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      notifySuccess("Note deleted");
    } catch (e) {
      notifyError(e?.response?.data?.message || "Delete failed");
    }
  };

  const openNoteEdit = (note) => {
    setEditingNote(note);
    setNoteEditForm({
      title: note.title || "",
      description: note.description || "",
      subject: note.subject || "",
      onedriveLink: note.onedriveLink || "",
      tags: Array.isArray(note.tags) ? note.tags.join(", ") : "",
      year: note.year ?? "",
    });
  };

  const saveNoteEdit = async (e) => {
    e.preventDefault();
    if (!editingNote) return;
    try {
      setUpdatingNote(true);
      const payload = {
        title: noteEditForm.title.trim(),
        description: noteEditForm.description.trim(),
        subject: noteEditForm.subject.trim(),
        onedriveLink: noteEditForm.onedriveLink.trim(),
        tags: noteEditForm.tags,
        year: noteEditForm.year === "" ? "" : Number(noteEditForm.year),
      };
      const res = await updateNoteById(editingNote._id, payload);
      const updated = res?.data;
      if (updated?._id) {
        setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
      }
      setEditingNote(null);
      notifySuccess("Note updated");
    } catch (e2) {
      notifyError(e2?.response?.data?.message || "Failed to update note");
    } finally {
      setUpdatingNote(false);
    }
  };

  const openEdit = () => {
    if (!user) return;
    setSaveError("");
    setForm({ name: user.name || "", bio: user.bio || "", location: user.location || "", website: user.website || "", github: user.github || "", twitter: user.twitter || "", linkedin: user.linkedin || "", department: user.department || "", year: user.year || "", phone: user.phone || "" });
    setIsEditOpen(true);
  };

  const closeEdit = () => { if (!isSaving) { setIsEditOpen(false); setSaveError(""); } };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true); setSaveError("");
      await dispatch(updateUserProfile(form)).unwrap();
      await dispatch(fetchUserProfile()).unwrap();
      setIsEditOpen(false);
      notifySuccess("Profile updated");
    } catch (err) {
      const msg = typeof err === "string" ? err : "Save failed";
      setSaveError(msg); notifyError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    const ok = await confirmAction("Sign out of Smart Campus?", { confirmText: "Sign out" });
    if (!ok) return;
    dispatch(logout());
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    const ok = await confirmAction(
      "Are you absolutely sure? This will permanently delete your account and all associated data. This action cannot be undone.",
      { confirmText: "Delete Account", danger: true }
    );
    if (!ok) return;

    try {
      await dispatch(deleteUserAccount()).unwrap();
      dispatch(logout());
      navigate("/");
      notifySuccess("Account deleted successfully");
    } catch (error) {
      notifyError(error?.message || "Failed to delete account");
    }
  };

  const fmtDate = (d) => {
    const v = new Date(d);
    if (isNaN(v.getTime())) return "—";
    return v.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const fmtUrl = (v) => (!v ? "" : v.startsWith("http") ? v : `https://${v}`);

  if (!user || isLoading) {
    return (
      <div className="pr-root">
        <div className="pr-splash">
          <div className="pr-splash__ring" />
          <span>Loading profile…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pr-root">
      {/* Lightweight CSS background */}
      <div className="pr-canvas" />


      {/* ── MAIN ───────────────────────────────────────────────────────── */}
      <main className="pr-main">

        {/* TOP BAR / BREADCRUMBS */}
        <div className="pr-topbar">
          <div className="pr-topbar__left">
            <button className="pr-back-btn" onClick={() => navigate(-1)} title="Go Back">
              <ArrowLeft size={20} />
            </button>
            <div className="pr-topbar__breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <ChevronRight size={16} />
              <span className="pr-topbar__page">My Profile</span>
            </div>
          </div>
          <div className="pr-topbar__meta">
            <div className="pr-online-dot" />
            <span>Active Session</span>
          </div>
        </div>

        {/* HERO SECTION */}
        <section className="pr-hero">
          <div className="pr-hero__id">
            <div className="pr-avatar-wrap">
              <div className="pr-avatar">
                {user.profilePicture
                  ? <img src={user.profilePicture} alt={user.name} />
                  : <span>{user.name?.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="pr-avatar-badge"><CheckCircle2 size={14} /></div>
            </div>

            <div className="pr-hero__text">
              <p className="pr-hero__role">{user.role || "Student"} • {user.department || "No department"}</p>
              <h1 className="pr-hero__name">{user.name}</h1>
              {user.bio && <p className="pr-hero__bio">{user.bio}</p>}
              <div className="pr-hero__chips">
                <span className="pr-chip"><MapPin size={12} /> {user.location || "On Campus"}</span>
                {user.studentId && <span className="pr-chip"><Shield size={12} /> #{user.studentId}</span>}
                <span className="pr-chip"><Calendar size={12} /> Joined {new Date(user.createdAt || Date.now()).getFullYear()}</span>
              </div>
            </div>
          </div>

          <div className="pr-hero__side">
            <div className="pr-score-card">
              <div className="pr-score-label">Engagement Score</div>
              <div className="pr-score-val">84<span>/100</span></div>
              <div className="pr-score-bar"><div className="pr-score-fill" style={{ width: "84%" }} /></div>
            </div>
            <div className="pr-hero__actions">
              <div className="pr-socials">
                {user.website && <a href={fmtUrl(user.website)} target="_blank" rel="noopener noreferrer" className="pr-social"><Globe size={15} /></a>}
                {user.github && <a href={fmtUrl(user.github)} target="_blank" rel="noopener noreferrer" className="pr-social"><Github size={15} /></a>}
                {user.linkedin && <a href={fmtUrl(user.linkedin)} target="_blank" rel="noopener noreferrer" className="pr-social"><Linkedin size={15} /></a>}
              </div>
              <button className="pr-btn-edit" onClick={openEdit}>
                <Edit3 size={14} /> Edit Profile
              </button>
            </div>
          </div>
        </section>

        {/* STAT GRID */}
        <section className="pr-stats">
          <div className="pr-stat pr-stat--teal">
            <div className="pr-stat__glow" />
            <div className="pr-stat__icon"><Video size={20} /></div>
            <div className="pr-stat__content">
              <div className="pr-stat__val"><Counter value={summary.total} /></div>
              <div className="pr-stat__lbl">Kuppi Sessions</div>
            </div>
          </div>
          <div className="pr-stat pr-stat--green">
            <div className="pr-stat__glow" />
            <div className="pr-stat__icon"><Activity size={20} /></div>
            <div className="pr-stat__content">
              <div className="pr-stat__val"><Counter value={summary.active} /></div>
              <div className="pr-stat__lbl">Active Posts</div>
            </div>
          </div>
          <div className="pr-stat pr-stat--amber">
            <div className="pr-stat__glow" />
            <div className="pr-stat__icon"><Clock size={20} /></div>
            <div className="pr-stat__content">
              <div className="pr-stat__val"><Counter value={summary.upcoming} /></div>
              <div className="pr-stat__lbl">Upcoming</div>
            </div>
          </div>
          <div className="pr-stat pr-stat--indigo">
            <div className="pr-stat__glow" />
            <div className="pr-stat__icon"><Archive size={20} /></div>
            <div className="pr-stat__content">
              <div className="pr-stat__val"><Counter value={summary.archived} /></div>
              <div className="pr-stat__lbl">Completed</div>
            </div>
          </div>
        </section>

        {/* TABS */}
        <div className="pr-tabs-wrap">
          <div className="pr-tabs">
            {TABS.map((t) => (
              <button key={t} className={`pr-tab ${activeTab === t ? "pr-tab--on" : ""}`} onClick={() => setActiveTab(t)}>
                {t === "overview" && <LayoutDashboard size={16} />}
                {t === "activity" && <Activity size={16} />}
                {t === "settings" && <Settings size={16} />}
                <span>{t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT PANEL */}
        <div className="pr-panel">

          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="pr-overview">
              {/* About card */}
              <div className="pr-card pr-card--about">
                <h3 className="pr-card__title">About</h3>
                <p className="pr-card__text">{user.bio || "No bio added yet. Click Edit Profile to add one."}</p>
                <div className="pr-card__facts">
                  <div className="pr-fact"><Video size={13} />{summary.total} total sessions</div>
                  <div className="pr-fact"><Activity size={13} />{summary.active} currently active</div>
                  <div className="pr-fact"><Calendar size={13} />Member since {new Date(user.createdAt || Date.now()).getFullYear()}</div>
                </div>
              </div>

              {/* Recent logs card */}
              <div className="pr-card pr-card--logs">
                <div className="pr-card__row">
                  <h3 className="pr-card__title">Recent Kuppi Logs</h3>
                  <button className="pr-view-all" onClick={() => setActiveTab("activity")}>View all →</button>
                </div>

                {recentLogs.length === 0 ? (
                  <p className="pr-empty-sm">No sessions published yet.</p>
                ) : (
                  <div className="pr-log-list">
                    {recentLogs.map((log, i) => (
                      <div key={log._id} className="pr-log" style={{ animationDelay: `${i * 70}ms` }}>
                        <span className="pr-log__num">{String(i + 1).padStart(2, "0")}</span>
                        <div className="pr-log__body">
                          <p className="pr-log__title">{log.title}</p>
                          <span className="pr-log__time"><Clock size={11} />{fmtDate(log.createdAt)}</span>
                        </div>
                        <span className={`pr-log__dot ${log.isArchived ? "pr-log__dot--off" : "pr-log__dot--on"}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ACTIVITY ── */}
          {activeTab === "activity" && (
            <div className="pr-activity">
              <div className="pr-activity__header">
                <h3>Published Kuppi Sessions</h3>
                <span className="pr-count-badge">{kuppiLogs.length}</span>
              </div>

              {logsLoading && (
                <div className="pr-loader">
                  <div className="pr-loader__ring" />
                  <span>Loading sessions…</span>
                </div>
              )}
              {!logsLoading && logsError && <p className="pr-error">{logsError}</p>}
              {!logsLoading && !logsError && kuppiLogs.length === 0 && (
                <div className="pr-empty"><Video size={32} /><p>No sessions published yet.</p></div>
              )}

              {!logsLoading && !logsError && (
                <div className="pr-timeline">
                  {kuppiLogs.map((log, i) => (
                    <article key={log._id} className="pr-titem" style={{ animationDelay: `${i * 40}ms` }}>
                      <div className="pr-titem__track">
                        <div className="pr-titem__dot" />
                        {i < kuppiLogs.length - 1 && <div className="pr-titem__line" />}
                      </div>
                      <div className="pr-titem__body">
                        <div className="pr-titem__top">
                          <p className="pr-titem__title">{log.title}</p>
                          <span className={`pr-badge ${log.isArchived ? "pr-badge--dim" : "pr-badge--teal"}`}>
                            {log.isArchived ? "Archived" : "Active"}
                          </span>
                          <button className="pr-del" onClick={() => openKuppiEdit(log)} title="Edit" style={{ color: "#34d399", borderColor: "rgba(52, 211, 153, 0.35)" }}>
                            <Edit3 size={13} />
                          </button>
                          <button className="pr-del" onClick={() => handleDelete(log._id)} title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="pr-titem__meta">
                          <span><Clock size={11} /> Published {fmtDate(log.createdAt)}</span>
                          <span><Calendar size={11} /> Event {fmtDate(log.eventDate)}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="pr-activity__header" style={{ marginTop: 24 }}>
                <h3>Published Notes</h3>
                <span className="pr-count-badge">{notes.length}</span>
              </div>

              {notesLoading && (
                <div className="pr-loader">
                  <div className="pr-loader__ring" />
                  <span>Loading notes…</span>
                </div>
              )}
              {!notesLoading && notesError && <p className="pr-error">{notesError}</p>}
              {!notesLoading && !notesError && notes.length === 0 && (
                <div className="pr-empty"><BookMarked size={32} /><p>No notes published yet.</p></div>
              )}

              {!notesLoading && !notesError && notes.length > 0 && (
                <div className="pr-timeline">
                  {notes.map((note, i) => (
                    <article key={note._id} className="pr-titem" style={{ animationDelay: `${i * 40}ms` }}>
                      <div className="pr-titem__track">
                        <div className="pr-titem__dot" />
                        {i < notes.length - 1 && <div className="pr-titem__line" />}
                      </div>
                      <div className="pr-titem__body">
                        <div className="pr-titem__top">
                          <p className="pr-titem__title">{note.title}</p>
                          <span className="pr-badge pr-badge--teal">{note.subject || "General"}</span>
                          <button className="pr-del" onClick={() => openNoteEdit(note)} title="Edit" style={{ color: "#34d399", borderColor: "rgba(52, 211, 153, 0.35)" }}>
                            <Edit3 size={13} />
                          </button>
                          <button className="pr-del" onClick={() => handleDeleteNote(note._id)} title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="pr-titem__meta">
                          <span><Clock size={11} /> Published {fmtDate(note.createdAt)}</span>
                          {note.year ? <span><Shield size={11} /> Year {note.year}</span> : <span><Shield size={11} /> Year —</span>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS (DANGER ZONE) ── */}
          {activeTab === "settings" && (
            <div className="pr-settings pr-panel">
              <div className="pr-danger-zone">
                <div className="pr-danger-header">
                  <div className="pr-danger-badge">
                    <ShieldAlert size={20} />
                    <span>Danger Zone</span>
                  </div>
                  <h3 className="pr-danger-title">Security & Account Privacy</h3>
                </div>

                <div className="pr-caution-card">
                  <div className="pr-caution-icon-wrap">
                    <AlertTriangle size={32} className="pulse-danger" />
                  </div>
                  <div className="pr-caution-content">
                    <h4>Critical Warning</h4>
                    <p>
                      Deleting your account is a <strong>permanent</strong> and irreversible action.
                      Once confirmed, all your data will be scrubbed from our systems immediately.
                    </p>
                  </div>
                </div>

                <div className="pr-impact-list">
                  <div className="pr-impact-item" style={{ animationDelay: "0.1s" }}>
                    <div className="pr-impact-bullet" />
                    <div className="pr-impact-text">All your published <strong>Kuppi sessions</strong> and posts will be deleted.</div>
                  </div>
                  <div className="pr-impact-item" style={{ animationDelay: "0.2s" }}>
                    <div className="pr-impact-bullet" />
                    <div className="pr-impact-text">Your <strong>personal notes</strong> and resource contributions will be removed.</div>
                  </div>
                  <div className="pr-impact-item" style={{ animationDelay: "0.3s" }}>
                    <div className="pr-impact-bullet" />
                    <div className="pr-impact-text">Access to <strong>study groups</strong> and community discussions will be revoked.</div>
                  </div>
                  <div className="pr-impact-item" style={{ animationDelay: "0.4s" }}>
                    <div className="pr-impact-bullet" />
                    <div className="pr-impact-text">Your <strong>profile history</strong>, badges, and reputation points will be lost.</div>
                  </div>
                </div>

                <div className="pr-danger-footer">
                  <div className="pr-danger-check">
                    <Trash2 size={16} color="var(--danger)" />
                    <p>This action cannot be undone. Please proceed with extreme caution.</p>
                  </div>
                  <button className="pr-btn-delete-final shake-hover" onClick={handleDeleteAccount}>
                    <span>Delete Permanently</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── EDIT MODAL ─────────────────────────────────────────────────────── */}
      {editingKuppi && (
        <div className="pr-overlay" onClick={() => !updatingKuppi && setEditingKuppi(null)}>
          <div className="pr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pr-modal__head">
              <h3>Edit Kuppi Session</h3>
              <button className="pr-modal__x" onClick={() => !updatingKuppi && setEditingKuppi(null)}><X size={16} /></button>
            </div>
            <form className="pr-modal__form" onSubmit={saveKuppiEdit}>
              <div className="pr-field">
                <label>Title *</label>
                <input className="pr-input" type="text" required value={kuppiEditForm.title} onChange={(e) => setKuppiEditForm({ ...kuppiEditForm, title: e.target.value })} />
              </div>
              <div className="pr-field">
                <label>Description *</label>
                <textarea className="pr-input pr-textarea" rows={3} required value={kuppiEditForm.description} onChange={(e) => setKuppiEditForm({ ...kuppiEditForm, description: e.target.value })} />
              </div>
              <div className="pr-field-row">
                <div className="pr-field">
                  <label>Subject</label>
                  <input className="pr-input" type="text" value={kuppiEditForm.subject} onChange={(e) => setKuppiEditForm({ ...kuppiEditForm, subject: e.target.value })} />
                </div>
                <div className="pr-field">
                  <label>Event Date *</label>
                  <input className="pr-input" type="datetime-local" required value={kuppiEditForm.eventDate} onChange={(e) => setKuppiEditForm({ ...kuppiEditForm, eventDate: e.target.value })} />
                </div>
              </div>
              <div className="pr-field">
                <label>Meeting Link</label>
                <input className="pr-input" type="url" value={kuppiEditForm.meetingLink} onChange={(e) => setKuppiEditForm({ ...kuppiEditForm, meetingLink: e.target.value })} />
              </div>
              <div className="pr-modal__foot">
                <button type="button" className="pr-btn-cancel" onClick={() => setEditingKuppi(null)} disabled={updatingKuppi}>Cancel</button>
                <button type="submit" className="pr-btn-save" disabled={updatingKuppi}>{updatingKuppi ? "Saving…" : "Save Kuppi"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingNote && (
        <div className="pr-overlay" onClick={() => !updatingNote && setEditingNote(null)}>
          <div className="pr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pr-modal__head">
              <h3>Edit Note</h3>
              <button className="pr-modal__x" onClick={() => !updatingNote && setEditingNote(null)}><X size={16} /></button>
            </div>
            <form className="pr-modal__form" onSubmit={saveNoteEdit}>
              <div className="pr-field">
                <label>Title *</label>
                <input className="pr-input" type="text" required value={noteEditForm.title} onChange={(e) => setNoteEditForm({ ...noteEditForm, title: e.target.value })} />
              </div>
              <div className="pr-field">
                <label>Description *</label>
                <textarea className="pr-input pr-textarea" rows={3} required value={noteEditForm.description} onChange={(e) => setNoteEditForm({ ...noteEditForm, description: e.target.value })} />
              </div>
              <div className="pr-field-row">
                <div className="pr-field">
                  <label>Subject</label>
                  <input className="pr-input" type="text" value={noteEditForm.subject} onChange={(e) => setNoteEditForm({ ...noteEditForm, subject: e.target.value })} />
                </div>
                <div className="pr-field">
                  <label>Year</label>
                  <input className="pr-input" type="number" min={1} max={6} value={noteEditForm.year} onChange={(e) => setNoteEditForm({ ...noteEditForm, year: e.target.value })} />
                </div>
              </div>
              <div className="pr-field">
                <label>Tags (comma separated)</label>
                <input className="pr-input" type="text" value={noteEditForm.tags} onChange={(e) => setNoteEditForm({ ...noteEditForm, tags: e.target.value })} />
              </div>
              <div className="pr-field">
                <label>OneDrive Link</label>
                <input className="pr-input" type="url" value={noteEditForm.onedriveLink} onChange={(e) => setNoteEditForm({ ...noteEditForm, onedriveLink: e.target.value })} />
              </div>
              <div className="pr-modal__foot">
                <button type="button" className="pr-btn-cancel" onClick={() => setEditingNote(null)} disabled={updatingNote}>Cancel</button>
                <button type="submit" className="pr-btn-save" disabled={updatingNote}>{updatingNote ? "Saving…" : "Save Note"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="pr-overlay" onClick={closeEdit}>
          <div className="pr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pr-modal__head">
              <h3>Edit Profile</h3>
              <button className="pr-modal__x" onClick={closeEdit}><X size={16} /></button>
            </div>

            <form className="pr-modal__form" onSubmit={handleSave}>
              <div className="pr-field">
                <label>Display Name *</label>
                <input className="pr-input" type="text" required
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="pr-field-row">
                <div className="pr-field">
                  <label>Department</label>
                  <input className="pr-input" type="text" placeholder="e.g. Computer Science"
                    value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
                <div className="pr-field">
                  <label>Year</label>
                  <input className="pr-input" type="text" placeholder="e.g. 2nd Year"
                    value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                </div>
              </div>
              <div className="pr-field">
                <label>Bio</label>
                <textarea className="pr-input pr-textarea" rows={3}
                  value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <div className="pr-field-row">
                <div className="pr-field">
                  <label>Location</label>
                  <input className="pr-input" type="text"
                    value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="pr-field">
                  <label>Phone</label>
                  <input className="pr-input" type="text" placeholder="e.g. +94 77 123 4567"
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="pr-field">
                <label>Website</label>
                <input className="pr-input" type="text"
                  value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div className="pr-field-row">
                <div className="pr-field">
                  <label>GitHub</label>
                  <input className="pr-input" type="text"
                    value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} />
                </div>
                <div className="pr-field">
                  <label>Twitter</label>
                  <input className="pr-input" type="text"
                    value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} />
                </div>
              </div>
              <div className="pr-field">
                <label>LinkedIn</label>
                <input className="pr-input" type="text"
                  value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
              </div>
              {saveError && <p className="pr-form-err">{saveError}</p>}
              <div className="pr-modal__foot">
                <button type="button" className="pr-btn-cancel" onClick={closeEdit}>Cancel</button>
                <button type="submit" className="pr-btn-save" disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;