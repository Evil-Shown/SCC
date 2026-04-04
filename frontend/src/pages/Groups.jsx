import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchGroups, createGroup, joinGroup, setFilters, clearError,
} from "../features/groups/groupSlice";
import { logout } from "../features/auth/authSlice";
import {
  Plus, Search, Users, Lock, Globe, Tag, X,
  SlidersHorizontal, Waves, Shield,
  Filter, TrendingUp, Hash, ArrowLeft,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import GroupCard from "../components/groups/GroupCard";
import MyInvitesBanner from "../components/groups/MyInvitesBanner";
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

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/dashboard");
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

  if (!user) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#010810", color: "#2a9d8f", fontFamily: "Inter, sans-serif" }}>
      Loading...
    </div>
  );

  return (
    <div className="db-root dashboard-page grp-root">

      <div className="grp-unified-layout fade-in">

        <div style={{ padding: "1rem 1rem 0", maxWidth: 1480, width: "100%", margin: "0 auto" }}>
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "0.7rem 1rem",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "var(--surface-1)",
              color: "var(--text)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* ── HERO BANNER ── */}
        <section className="grp-hero-banner">
          <div className="grp-hero-content">
            <div className="grp-hero-text-block">
              <div className="grp-hero-badge">
                <span className="grp-live-dot"></span> Collaborative Spaces
              </div>
              <h1 className="grp-hero-title">Study & Project Groups</h1>
              <p className="grp-hero-sub">
                Join forces with your peers. Manage group assignments, schedule hybrid meetups, and share resources easily.
              </p>
              <div className="grp-hero-stats">
                <div className="grp-h-stat"><Users size={14} /> <span><b>{groups.length}</b> Groups</span></div>
                <div className="grp-h-stat" style={{ color: "var(--cyan)" }}><Shield size={14} /> <span><b>{myGroupCount}</b> Joined</span></div>
                <div className="grp-h-stat" style={{ color: "var(--color-success, #10b981)" }}><Globe size={14} /> <span><b>{publicCount}</b> Public</span></div>
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

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
    </div>
  );
};

export default Groups;
