import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { logout, fetchUserProfile, updateUserProfile } from "../features/auth/authSlice";
import {
  BookMarked, Users, Calendar, GraduationCap, LogOut,
  Settings, User as UserIcon, Home as HomeIcon, Video, Activity,
  Shield, LayoutDashboard, Mail, MapPin, Github, Twitter, Linkedin,
  Edit3, Clock, Globe, Trash2, CheckCircle2, Archive, Sparkles, X,
  ChevronRight,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import "../styles/Dashboard.css";
import "../styles/Notifications.css";
import "../styles/Profile.css";
import { deleteKuppiPost, getMyKuppiLogs } from "../services/kuppiService";
import { confirmAction, notifyError, notifySuccess } from "../utils/toast";

const TABS = ["overview", "activity", "settings"];

/* ── Animated number counter ─────────────────────────────────────────── */
const Counter = ({ value }) => {
  return <span>{value}</span>;
};

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useSelector((s) => s.auth);
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab]         = useState("overview");
  const [isEditOpen, setIsEditOpen]       = useState(false);
  const [isSaving, setIsSaving]           = useState(false);
  const [saveError, setSaveError]         = useState("");
  const [form, setForm] = useState({ name: "", bio: "", location: "", website: "", github: "", twitter: "", linkedin: "", department: "", year: "", phone: "" });

  const [kuppiLogs, setKuppiLogs]           = useState([]);
  const [logsLoading, setLogsLoading]       = useState(false);
  const [logsError, setLogsError]           = useState("");

  const navLinks = [
    { icon: <HomeIcon size={16} />,       label: "Home",      path: "/" },
    { icon: <LayoutDashboard size={16} />, label: "Dashboard", path: "/dashboard" },
    { icon: <BookMarked size={16} />,      label: "Notes",     path: "/notes" },
    { icon: <Video size={16} />,           label: "Kuppi",     path: "/kuppi" },
    { icon: <Users size={16} />,           label: "Groups",    path: "/groups" },
    { icon: <UserIcon size={16} />,        label: "Profile",   path: "/profile" },
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

  const summary = useMemo(() => {
    const total    = kuppiLogs.length;
    const active   = kuppiLogs.filter((l) => !l.isArchived).length;
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
    navigate("/login");
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

      {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
      <nav className="pr-nav">
        <Link to="/dashboard" className="pr-nav__brand">
          <GraduationCap size={20} />
        </Link>

        <div className="pr-nav__links">
          {navLinks.map((lnk) => (
            <Link
              key={lnk.path}
              to={lnk.path}
              className={`pr-nav__link${lnk.path === "/profile" ? " pr-nav__link--on" : ""}`}
              title={lnk.label}
            >
              {lnk.icon}
            </Link>
          ))}
        </div>

        <div className="pr-nav__foot">
          <NotificationBell />
          <button className="pr-nav__out" onClick={handleLogout} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </nav>

      {/* ── MAIN ───────────────────────────────────────────────────────── */}
      <main className="pr-main">

        {/* HEADER BAR */}
        <header className="pr-topbar">
          <div className="pr-topbar__breadcrumb">
            <span>Smart Campus</span>
            <ChevronRight size={14} />
            <span className="pr-topbar__page">Profile</span>
          </div>
          <div className="pr-topbar__meta">
            <span className="pr-online-dot" />
            <span>{user.email}</span>
          </div>
        </header>

        {/* PROFILE HERO */}
        <section className="pr-hero">
          {/* Avatar + name */}
          <div className="pr-hero__id">
            <div className="pr-avatar">
              {user.profilePicture
                ? <img src={user.profilePicture} alt={user.name} />
                : <span>{user.name?.charAt(0).toUpperCase()}</span>}
            </div>

            <div className="pr-hero__text">
              <p className="pr-hero__role">{user.role || "Student"} · {user.department || "No department"}</p>
              <h1 className="pr-hero__name">{user.name}</h1>

              {user.bio && <p className="pr-hero__bio">{user.bio}</p>}

              <div className="pr-hero__chips">
                <span className="pr-chip"><Mail size={12} />{user.email}</span>
                {user.location && <span className="pr-chip"><MapPin size={12} />{user.location}</span>}
                {user.studentId && <span className="pr-chip"><Shield size={12} />#{user.studentId}</span>}
                <span className="pr-chip"><Calendar size={12} />Since {new Date(user.createdAt || Date.now()).getFullYear()}</span>
              </div>
            </div>
          </div>

          {/* Actions + socials */}
          <div className="pr-hero__actions">
            <div className="pr-socials">
              {user.website  && <a href={fmtUrl(user.website)}  target="_blank" rel="noopener noreferrer" className="pr-social" title="Website"><Globe size={15} /></a>}
              {user.github   && <a href={fmtUrl(user.github)}   target="_blank" rel="noopener noreferrer" className="pr-social" title="GitHub"><Github size={15} /></a>}
              {user.twitter  && <a href={fmtUrl(user.twitter)}  target="_blank" rel="noopener noreferrer" className="pr-social" title="Twitter"><Twitter size={15} /></a>}
              {user.linkedin && <a href={fmtUrl(user.linkedin)} target="_blank" rel="noopener noreferrer" className="pr-social" title="LinkedIn"><Linkedin size={15} /></a>}
            </div>
            <button className="pr-btn-edit" onClick={openEdit}>
              <Edit3 size={14} /> Edit Profile
            </button>
          </div>
        </section>

        {/* STAT ROW */}
        <div className="pr-stats">
          {[
            { icon: <Video size={16} />,        label: "Published",  value: summary.total,    c: "teal"  },
            { icon: <CheckCircle2 size={16} />,  label: "Active",     value: summary.active,   c: "green" },
            { icon: <Archive size={16} />,       label: "Archived",   value: summary.archived, c: "amber" },
            { icon: <Sparkles size={16} />,      label: "Upcoming",   value: summary.upcoming, c: "indigo" },
          ].map(({ icon, label, value, c }) => (
            <div key={label} className={`pr-stat pr-stat--${c}`}>
              <div className="pr-stat__icon">{icon}</div>
              <div className="pr-stat__val"><Counter value={value} /></div>
              <div className="pr-stat__lbl">{label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="pr-tabs">
          {[
            { id: "overview",  label: "Overview",  icon: <UserIcon size={14} /> },
            { id: "activity",  label: "Activity",  icon: <Activity size={14} /> },
            { id: "settings",  label: "Settings",  icon: <Settings size={14} /> },
          ].map((t) => (
            <button
              key={t.id}
              className={`pr-tab${activeTab === t.id ? " pr-tab--on" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon}{t.label}
            </button>
          ))}
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
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === "settings" && (
            <div className="pr-settings">
              <h3 className="pr-settings__title">Profile Information</h3>
              <div className="pr-settings__table">
                {[
                  { label: "Name",       value: user.name },
                  { label: "Department", value: user.department },
                  { label: "Year",       value: user.year },
                  { label: "Phone",      value: user.phone },
                  { label: "Location",   value: user.location },
                  { label: "Bio",        value: user.bio },
                  { label: "Website",    value: user.website },
                  { label: "GitHub",     value: user.github },
                  { label: "Twitter",    value: user.twitter },
                  { label: "LinkedIn",   value: user.linkedin },
                ].map(({ label, value }) => (
                  <div key={label} className="pr-settings__row">
                    <span className="pr-settings__key">{label}</span>
                    <span className="pr-settings__val">{value || <em className="pr-nil">Not set</em>}</span>
                  </div>
                ))}
              </div>
              <div className="pr-settings__actions">
                <button className="pr-btn-edit" onClick={openEdit}><Edit3 size={14} /> Edit Details</button>
                <button className="pr-btn-logout" onClick={handleLogout}><LogOut size={14} /> Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── EDIT MODAL ─────────────────────────────────────────────────────── */}
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