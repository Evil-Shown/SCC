import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchGroups, createGroup, joinGroup, setFilters, clearError,
} from "../features/groups/groupSlice";
import { logout } from "../features/auth/authSlice";
import {
  Plus, Search, Users, Lock, Globe, Tag, X,
  SlidersHorizontal, Waves, LogOut, Home as HomeIcon,
  Brain, BookMarked, Video, LayoutDashboard,
  GraduationCap, Activity, Radio, Shield,
  Filter, TrendingUp, Hash,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import NotificationBell from "../components/NotificationBell";
import GroupCard from "../components/groups/GroupCard";
import { confirmAction } from "../utils/toast";
import "../styles/Dashboard.css";
import "../styles/Groups.css";
import "../styles/GroupsExtra.css";
import "../styles/Notifications.css";


/* ═══════════════════════════════════════════════════════════
   CREATE GROUP MODAL
═══════════════════════════════════════════════════════════ */
function CreateGroupModal({ onClose }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    name: "", description: "", subject: "", courseCode: "",
    tags: "", isPublic: true, maxMembers: 30,
  });
  const [tagInput, setTagInput] = useState("");
  const [tagList, setTagList] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tagList.includes(t)) setTagList((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (tag) => setTagList((prev) => prev.filter((t) => t !== tag));

  const handleTagKey = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErr("Group name is required");
    setBusy(true); setErr("");
    try {
      // merge typed tag input with tag list
      const allTags = [...tagList];
      if (tagInput.trim()) allTags.push(tagInput.trim());
      await dispatch(createGroup({ ...form, tags: allTags })).unwrap();
      onClose();
    } catch (e) { setErr(typeof e === "string" ? e : "Failed to create group"); }
    finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content scale-in" style={{ maxWidth: "540px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              width: 36, height: 36, borderRadius: 8,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Users size={18} color="#fff" />
            </span>
            Create Study Group
          </h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <form id="create-group-form" onSubmit={submit}
            style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>

            {/* Name */}
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="form-label">Group Name *</label>
              <input className="form-input" value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. CS3020 Final Sprint" maxLength={80} required />
            </div>

            {/* Subject + Course */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)" }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Subject</label>
                <input className="form-input" value={form.subject}
                  onChange={(e) => set("subject", e.target.value)}
                  placeholder="Software Engineering" />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Course Code</label>
                <input className="form-input" value={form.courseCode}
                  onChange={(e) => set("courseCode", e.target.value)}
                  placeholder="CS3020" />
              </div>
            </div>

            {/* Description */}
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What will this group work on?" rows={3}
                style={{ resize: "vertical" }} />
            </div>

            {/* Tags */}
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="form-label">Tags</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input className="form-input" value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
                  placeholder="algorithms, exam… (Enter to add)"
                  style={{ flex: 1 }} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>
                  Add
                </button>
              </div>
              {tagList.length > 0 && (
                <div className="cgm-tags-preview">
                  {tagList.map((t) => (
                    <span key={t} className="cgm-tag-chip">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "0 0 0 3px", lineHeight: 1 }}>
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Visibility + Max members */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)" }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Visibility</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { val: true, label: "Public", Icon: Globe },
                    { val: false, label: "Private", Icon: Lock },
                  ].map(({ val, label, Icon }) => (
                    <button key={label} type="button"
                      onClick={() => set("isPublic", val)}
                      style={{
                        flex: 1, padding: "8px 4px", borderRadius: "var(--radius-md)",
                        cursor: "pointer", fontWeight: 600, fontSize: "12px",
                        border: `2px solid ${form.isPublic === val ? "var(--color-primary-500)" : "var(--color-border)"}`,
                        background: form.isPublic === val ? "rgba(99,102,241,.12)" : "var(--color-bg-primary)",
                        color: form.isPublic === val ? "var(--color-primary-500)" : "var(--color-text-secondary)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      }}>
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>
                <span className="form-hint" style={{ marginTop: 5 }}>
                  {form.isPublic ? "Anyone can discover and join" : "Invite-only"}
                </span>
              </div>

              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Max Members ({form.maxMembers})</label>
                <input type="range" min={2} max={200} value={form.maxMembers}
                  onChange={(e) => set("maxMembers", parseInt(e.target.value))}
                  style={{ width: "100%", marginTop: 8, accentColor: "var(--color-primary-500)" }} />
                <span className="form-hint">{form.maxMembers} students maximum</span>
              </div>
            </div>

            {err && <p style={{ color: "var(--color-error)", fontSize: "var(--font-size-sm)", margin: 0 }}>{err}</p>}
          </form>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="create-group-form" className="btn btn-primary" disabled={busy}>
            {busy ? "Creating…" : <><Plus size={16} /> Create Group</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN GROUPS PAGE
═══════════════════════════════════════════════════════════ */
const PRESET_TAGS = ["Projects", "Exams", "Labs", "Assignments", "Research"];

const Groups = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { groups, isLoading, error, filters } = useSelector((s) => s.groups);
  const { user, isAuthenticated } = useSelector((s) => s.auth);

  const [showCreate, setShowCreate] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || "");
  const [joining, setJoining] = useState({});
  const [activeTag, setActiveTag] = useState(null);


  useEffect(() => { if (!isAuthenticated) navigate("/"); }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(fetchGroups({ search: filters.search, myGroups: filters.myGroups }));
  }, [dispatch, filters.search, filters.myGroups]);

  const handleSearch = useCallback((e) => {
    const val = e.target.value;
    setLocalSearch(val);
    dispatch(setFilters({ search: val }));
  }, [dispatch]);

  const handleJoin = async (groupId) => {
    setJoining((p) => ({ ...p, [groupId]: true }));
    try {
      await dispatch(joinGroup(groupId)).unwrap();
      navigate(`/groups/${groupId}`);
    } catch (e) { console.error(e); }
    finally { setJoining((p) => ({ ...p, [groupId]: false })); }
  };

  const handleLogout = async () => {
    const confirmed = await confirmAction("Are you sure you want to log out?", { confirmText: "Log out" });
    if (!confirmed) return;
    dispatch(logout());
    navigate("/");
  };

  // Computed stats
  const myGroupCount = groups.filter((g) => g.members?.some((m) => {
    const uid = m.user?._id || m.user;
    return uid?.toString() === user?._id;
  })).length;
  const publicCount = groups.filter((g) => g.isPublic).length;

  // Filter by active tag (client-side)
  const displayGroups = activeTag
    ? groups.filter((g) => g.tags?.some((t) => t.toLowerCase().includes(activeTag.toLowerCase())))
    : groups;

  const navLinks = [
    { icon: <HomeIcon size={14} />, label: "Home", path: "/" },
    { icon: <LayoutDashboard size={14} />, label: "Dashboard", path: "/dashboard" },
    { icon: <Brain size={14} />, label: "Timetable", path: "/timetable" },
    { icon: <BookMarked size={14} />, label: "Notes", path: "/notes" },
    { icon: <Video size={14} />, label: "Kuppi", path: "/kuppi" },
    { icon: <Users size={14} />, label: "Groups", path: "/groups", active: true },
  ];

  if (!user) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#010810", color: "#2a9d8f", fontFamily: "Inter, sans-serif" }}>
      Loading...
    </div>
  );

  return (
    <div className="db-root dashboard-page">

      <div className="db-layout">
        {/* ── Navbar ── */}
        <header className="dashboard-header">
          <div className="dashboard-header__inner">
            <Link to="/dashboard" className="dashboard-logo">
              <span className="dashboard-logo__text">User Dashboard</span>
            </Link>

            <nav className="dashboard-nav">
              {navLinks.map((l, i) => (
                <Link
                  key={i}
                  to={l.path}
                  className={`dashboard-nav__link ${l.active ? "active" : ""}`}
                  style={{ "--i": i }}
                >
                  {l.icon}
                  <span>{l.label}</span>
                </Link>
              ))}
            </nav>

            <div className="dashboard-actions" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <NotificationBell />
              <button className="dashboard-profile-btn" onClick={() => navigate("/profile")}>
                <span className="dashboard-avatar">{user?.name?.charAt(0) || "U"}</span>
                <span className="dashboard-profile-name">{user?.name?.split(" ")[0] || "User"}</span>
              </button>
              <button className="dashboard-logout-btn" onClick={handleLogout}>
                <LogOut size={20} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </header>

        {/* ── Page body: sidebar + main ── */}
        <div style={{ display: "flex", position: "relative", zIndex: 10 }}>

          {/* ── LEFT SIDEBAR ── */}
          <div className="grp-sidebar" style={{ paddingTop: 20 }}>
            {/* Quick stats */}
            <div className="grp-sidebar-section">
              <div className="grp-sidebar-title">Overview</div>
              <div className="grp-sidebar-stat">
                <span className="grp-sidebar-stat-label">Total Groups</span>
                <span className="grp-sidebar-stat-val" style={{ color: "var(--bio)" }}>{groups.length}</span>
              </div>
              <div className="grp-sidebar-stat">
                <span className="grp-sidebar-stat-label">My Groups</span>
                <span className="grp-sidebar-stat-val" style={{ color: "#818cf8" }}>{myGroupCount}</span>
              </div>
              <div className="grp-sidebar-stat">
                <span className="grp-sidebar-stat-label">Public</span>
                <span className="grp-sidebar-stat-val" style={{ color: "#34d399" }}>{publicCount}</span>
              </div>
              <div className="grp-sidebar-stat">
                <span className="grp-sidebar-stat-label">Private</span>
                <span className="grp-sidebar-stat-val" style={{ color: "#fbbf24" }}>{groups.length - publicCount}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="grp-sidebar-section">
              <div className="grp-sidebar-title">Filters</div>
              <button
                className={`grp-toggle-btn ${filters.myGroups ? "active" : ""}`}
                style={{ width: "100%", marginBottom: 10 }}
                onClick={() => dispatch(setFilters({ myGroups: !filters.myGroups }))}
              >
                <Shield size={14} />
                {filters.myGroups ? "My Groups" : "All Groups"}
              </button>
            </div>

            {/* Tag chips */}
            <div className="grp-sidebar-section">
              <div className="grp-sidebar-title">Browse by Tag</div>
              <div className="grp-tag-chips">
                {PRESET_TAGS.map((tag) => (
                  <button key={tag}
                    className={`grp-tag-chip ${activeTag === tag ? "active" : ""}`}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}>
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button className="grp-create-btn" style={{ width: "100%" }} onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create Group
            </button>
          </div>

          {/* ── MAIN AREA ── */}
          <main className="grp-main-area">
            {/* Page heading */}
            <div className="grp-page-heading" style={{ animation: "riseIn .65s .05s ease both" }}>
              <h1 className="grp-page-title">Study & Project Groups</h1>
              <p className="grp-page-sub">
                Collaborate on projects, coordinate kuppi sessions, and schedule hybrid meetups — all in one place.
              </p>
            </div>

            {/* Stats row (mobile/tablet — desktop sees sidebar) */}
            <section className="db-stats" style={{ animation: "riseIn .65s .15s ease both" }}>
              <div className="db-stat hover-glow" style={{ "--ac": "#2a9d8f" }}>
                <div className="db-stat__icon"><Users size={16} /></div>
                <div>
                  <div className="db-stat__val">{groups.length}</div>
                  <div className="db-stat__lbl">Available</div>
                </div>
              </div>
              <div className="db-stat hover-glow" style={{ "--ac": "#818cf8" }}>
                <div className="db-stat__icon"><Shield size={16} /></div>
                <div>
                  <div className="db-stat__val">{myGroupCount}</div>
                  <div className="db-stat__lbl">My Groups</div>
                </div>
              </div>
              <div className="db-stat hover-glow" style={{ "--ac": "#34d399" }}>
                <div className="db-stat__icon"><Globe size={16} /></div>
                <div>
                  <div className="db-stat__val">{publicCount}</div>
                  <div className="db-stat__lbl">Public</div>
                </div>
              </div>
              <div className="db-stat hover-glow" style={{ "--ac": "#fbbf24" }}>
                <div className="db-stat__icon"><Lock size={16} /></div>
                <div>
                  <div className="db-stat__val">{groups.length - publicCount}</div>
                  <div className="db-stat__lbl">Private</div>
                </div>
              </div>
            </section>

            {/* Filter + action row */}
            <div className="grp-top-row" style={{ animation: "riseIn .65s .22s ease both" }}>
              {/* Search */}
              <div className="grp-search-bar">
                <Search size={15} className="grp-search-bar-icon" />
                <input
                  value={localSearch}
                  onChange={handleSearch}
                  placeholder="Search groups by name, subject, or course…"
                />
              </div>

              {/* My groups toggle */}
              <button
                className={`grp-toggle-btn ${filters.myGroups ? "active" : ""}`}
                onClick={() => dispatch(setFilters({ myGroups: !filters.myGroups }))}
              >
                <Filter size={14} />
                {filters.myGroups ? "My Groups" : "All Groups"}
              </button>

              {/* Create button */}
              <button className="grp-create-btn" onClick={() => setShowCreate(true)}>
                <Plus size={16} /> Create Group
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="alert alert-error" style={{ animation: "riseIn .3s ease both" }}>
                <span>{error}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => dispatch(clearError())}>
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Content */}
            <div style={{ animation: "riseIn .65s .3s ease both" }}>
              {isLoading && <LoadingSpinner text="Loading groups…" />}

              {/* Empty state */}
              {!isLoading && displayGroups.length === 0 && (
                <div className="grp-empty">
                  <div className="grp-empty__icon"><Users size={52} strokeWidth={1} /></div>
                  <h3 className="grp-empty__title">
                    {filters.myGroups ? "You haven't joined any groups yet" : "No groups found"}
                  </h3>
                  <p className="grp-empty__sub">
                    {filters.myGroups
                      ? "Create a group or browse public groups to join"
                      : "Be the first — create a study group and start collaborating!"}
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                    <button className="grp-create-btn" onClick={() => setShowCreate(true)}>
                      <Plus size={16} /> Create Group
                    </button>
                    {filters.myGroups && (
                      <button className="grp-toggle-btn" onClick={() => dispatch(setFilters({ myGroups: false }))}>
                        <Users size={14} /> Browse All
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Group cards grid */}
              {!isLoading && displayGroups.length > 0 && (
                <>
                  <div className="grp-section-head-row" style={{ marginBottom: 12 }}>
                    <span className="grp-section-label">
                      {filters.myGroups ? "My Groups" : activeTag ? `#${activeTag}` : "All Study Groups"}
                    </span>
                    <span className="grp-count-badge">
                      {displayGroups.length} group{displayGroups.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grp-cards-grid">
                    {displayGroups.map((group) => (
                      <GroupCard
                        key={group._id}
                        group={group}
                        currentUserId={user?._id}
                        onJoin={handleJoin}
                        onOpen={(id) => navigate(`/groups/${id}`)}
                        joining={joining}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
    </div>
  );
};

export default Groups;
