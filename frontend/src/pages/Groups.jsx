import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchGroups, createGroup, joinGroup, setFilters, clearError,
} from "../features/groups/groupSlice";
import {
  Plus, Search, Users, Lock, Globe, Tag, X,
  Shield,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import GroupCard from "../components/groups/GroupCard";
import MyInvitesBanner from "../components/groups/MyInvitesBanner";
import StudentDashboardShell from "../components/StudentDashboardShell";
import { useTheme } from "../context/ThemeContext";
import "../styles/Dashboard.css";
import "../styles/Groups.css";
import "../styles/GroupsExtra.css";
import "../styles/Notifications.css";


/* ═══════════════════════════════════════════════════════════
   CREATE GROUP MODAL
═══════════════════════════════════════════════════════════ */
// This is the popup where we type in the new group details
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
            <span className="modal-icon-box">
              <Users size={18} strokeWidth={1.75} />
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
                      className={`grp-form-seg ${form.isPublic === val ? "grp-form-seg--active" : ""}`}
                      onClick={() => set("isPublic", val)}
                    >
                      <Icon size={13} strokeWidth={1.75} /> {label}
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
                  style={{ width: "100%", marginTop: 8, accentColor: "var(--ds-accent, #2ecc71)" }} />
                <span className="form-hint">{form.maxMembers} students maximum</span>
              </div>
            </div>

            {err && <p style={{ color: "var(--color-error)", fontSize: "var(--font-size-sm)", margin: 0 }}>{err}</p>}
          </form>
        </div>

        <div className="modal-actions">
          <button type="button" className="grp-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="create-group-form" className="grp-btn-primary" disabled={busy}>
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

// This is the main page that shows all the groups you're in or can join
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

  // This runs when someone clicks the join button on a group card
  const handleJoin = async (groupId) => {
    setJoining((p) => ({ ...p, [groupId]: true }));
    try {
      await dispatch(joinGroup(groupId)).unwrap();
      navigate(`/groups/${groupId}`);
    } catch (e) { console.error(e); }
    finally { setJoining((p) => ({ ...p, [groupId]: false })); }
  };

  const { theme } = useTheme();

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

  if (!user) return (
    <StudentDashboardShell>
      <div className="dashboard-loading" data-theme={theme}>
        <div className="loading-spinner" />
        <span>Loading…</span>
      </div>
    </StudentDashboardShell>
  );

  return (
    <StudentDashboardShell>
      <div className="db-root dashboard-page grp-root">
        <div className="grp-unified-layout fade-in">

          {/* ── HERO BANNER ── */}
          <section className="grp-hero-banner">
            <div className="grp-hero-content">
              <div className="grp-hero-text-block">
                <div className="grp-hero-kicker">
                  <span className="grp-hero-kicker__icon" aria-hidden="true">
                    <Users size={18} strokeWidth={1.75} />
                  </span>
                  <span className="grp-hero-kicker__tag">Team space</span>
                </div>
                <h1 className="grp-hero-title">Study Groups</h1>
                <p className="grp-hero-sub">
                  Collaborate & learn together — live collaboration, shared resources, and hybrid meetups.
                </p>
                <div className="grp-hero-chips" aria-hidden="true">
                  <span className="grp-hero-chip">Live collaboration</span>
                  <span className="grp-hero-chip">Shared learning</span>
                </div>
                <div className="grp-summary-row" role="list">
                  <div className="grp-summary-stat" role="listitem">
                    <span className="grp-summary-stat__icon"><Users size={18} strokeWidth={1.75} /></span>
                    <span className="grp-summary-stat__value">{groups.length}</span>
                    <span className="grp-summary-stat__label">Groups</span>
                  </div>
                  <div className="grp-summary-stat" role="listitem">
                    <span className="grp-summary-stat__icon"><Shield size={18} strokeWidth={1.75} /></span>
                    <span className="grp-summary-stat__value">{myGroupCount}</span>
                    <span className="grp-summary-stat__label">Joined</span>
                  </div>
                  <div className="grp-summary-stat" role="listitem">
                    <span className="grp-summary-stat__icon"><Globe size={18} strokeWidth={1.75} /></span>
                    <span className="grp-summary-stat__value">{publicCount}</span>
                    <span className="grp-summary-stat__label">Public</span>
                  </div>
                </div>
              </div>
              <div className="grp-hero-right">
                <button className="grp-hero-create-btn" onClick={() => setShowCreate(true)}>
                  <Plus size={18} />
                  <span>Start a Group</span>
                </button>
              </div>
            </div>
            {/* Background elements */}
            <div className="grp-hero-shape-1"></div>
            <div className="grp-hero-shape-2"></div>
          </section>

          {/* ── MAIN CONTENT ── */}
          <main className="grp-unified-main">
            <MyInvitesBanner />

            {/* Elegant Filter Bar */}
            <div className="grp-modern-filter-bar" style={{ animation: "riseIn .65s .15s ease both" }}>
              <div className="grp-search-capsule">
                <Search size={16} className="grp-search-icon-mod" />
                <input
                  value={localSearch}
                  onChange={handleSearch}
                  placeholder="Search groups, subjects, or courses..."
                  className="grp-search-input-mod"
                />
              </div>

              <div className="grp-filter-sep"></div>

              <div className="grp-toggle-trio">
                <button
                  className={`grp-trio-btn ${!filters.myGroups ? "active" : ""}`}
                  onClick={() => dispatch(setFilters({ myGroups: false }))}
                >
                  <Globe size={15} /> Discover
                </button>
                <button
                  className={`grp-trio-btn ${filters.myGroups ? "active" : ""}`}
                  onClick={() => dispatch(setFilters({ myGroups: true }))}
                >
                  <Shield size={15} /> My Groups
                </button>
              </div>

              <div className="grp-filter-sep"></div>

              <div className="grp-tags-scroll">
                {PRESET_TAGS.map((tag) => (
                  <button key={tag}
                    className={`grp-tag-pill-mod ${activeTag === tag ? "active" : ""}`}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}>
                    #{tag}
                  </button>
                ))}
              </div>
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
    </StudentDashboardShell>
  );
};

export default Groups;
