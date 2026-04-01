import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchGroupById, leaveGroupAction, clearError,
} from "../features/groups/groupSlice";
import {
    fetchGroupMeetups, createGroupMeetup,
    meetupCreatedRealtime, meetupStatusChangedRealtime, meetupVotedRealtime,
} from "../features/meetups/meetupSlice";
import { joinGroup as joinSocketRoom, leaveGroup as leaveSocketRoom, getSocket } from "../socket/socket";
import * as groupService from "../services/groupService";
import {
    ArrowLeft, Users, MessageSquare, File, Calendar,
    Plus, X, Clock, Zap, Globe, Navigation, Shuffle,
    Award, Lock, Trash2, LogOut, Waves,
    Home as HomeIcon, Brain, BookMarked, Video, LayoutDashboard,
    ChevronDown, ChevronUp, AlertTriangle,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import NotificationBell from "../components/NotificationBell";
import ChatTab from "../components/groups/ChatTab";
import MeetupCard from "../components/groups/MeetupCard";
import FilesTab from "../components/groups/FilesTab";
import MemberList from "../components/groups/MemberList";
import { confirmAction } from "../utils/toast";
import "../styles/Dashboard.css";
import "../styles/Groups.css";
import "../styles/GroupsExtra.css";
import "../styles/Notifications.css";

/* ═══════════════════════════════════════════════════════════
   CREATE MEETUP MODAL
═══════════════════════════════════════════════════════════ */
function CreateMeetupModal({ groupId, memberCount, onClose }) {
    const dispatch = useDispatch();
    const [form, setForm] = useState({
        title: "", description: "", meetingDate: "", time: "",
        mode: "ONLINE", meetingLink: "", location: "",
        minConfirmations: Math.max(1, Math.floor(memberCount / 2)),
        duration: 60,
    });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const minDate = (() => {
        const t = new Date(); t.setDate(t.getDate() + 0);
        return t.toISOString().split("T")[0];
    })();

    const MODES = [
        { val: "ONLINE", Icon: Globe, label: "Online" },
        { val: "PHYSICAL", Icon: Navigation, label: "Physical" },
        { val: "HYBRID", Icon: Shuffle, label: "Hybrid" },
    ];

    const submit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return setErr("Title is required");
        if (!form.meetingDate) return setErr("Date is required");
        if (!form.time) return setErr("Time is required");
        if (form.mode === "ONLINE" && !form.meetingLink) return setErr("Meeting link is required for online meetups");
        if (form.mode === "PHYSICAL" && !form.location) return setErr("Location is required for physical meetups");
        setBusy(true); setErr("");
        try {
            await dispatch(createGroupMeetup({ groupId, payload: form })).unwrap();
            onClose();
        } catch (e) { setErr(typeof e === "string" ? e : "Failed to create meetup"); }
        finally { setBusy(false); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content scale-in" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                            <Calendar size={18} color="#fff" />
                        </span>
                        Schedule Meetup
                    </h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <form id="meetup-form" onSubmit={submit}
                        style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>

                        <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label">Title *</label>
                            <input className="form-input" value={form.title}
                                onChange={(e) => set("title", e.target.value)}
                                placeholder="Sprint review session" required />
                        </div>

                        <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label">Description</label>
                            <textarea className="form-textarea" value={form.description}
                                onChange={(e) => set("description", e.target.value)}
                                placeholder="Agenda and goals…" rows={2}
                                style={{ resize: "vertical" }} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)" }}>
                            <div className="form-field" style={{ marginBottom: 0 }}>
                                <label className="form-label">Date *</label>
                                <input type="date" className="form-input" value={form.meetingDate}
                                    onChange={(e) => set("meetingDate", e.target.value)} min={minDate} required />
                            </div>
                            <div className="form-field" style={{ marginBottom: 0 }}>
                                <label className="form-label">Time *</label>
                                <input type="time" className="form-input" value={form.time}
                                    onChange={(e) => set("time", e.target.value)} required />
                            </div>
                        </div>

                        {/* Mode segment */}
                        <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label">Meeting Mode</label>
                            <div style={{ display: "flex", gap: 6 }}>
                                {MODES.map(({ val, Icon, label }) => (
                                    <button key={val} type="button" onClick={() => set("mode", val)}
                                        style={{
                                            flex: 1, padding: "9px 4px", borderRadius: "var(--radius-md)",
                                            fontSize: "12px", fontWeight: 700, cursor: "pointer",
                                            border: `2px solid ${form.mode === val ? "var(--color-primary-500)" : "var(--color-border)"}`,
                                            background: form.mode === val ? "rgba(99,102,241,.12)" : "var(--color-bg-primary)",
                                            color: form.mode === val ? "var(--color-primary-500)" : "var(--color-text-secondary)",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                                            transition: "all var(--transition-fast)",
                                        }}>
                                        <Icon size={13} /> {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {["ONLINE", "HYBRID"].includes(form.mode) && (
                            <div className="form-field" style={{ marginBottom: 0 }}>
                                <label className="form-label">Meeting Link {form.mode === "ONLINE" ? "*" : "(optional)"}</label>
                                <input className="form-input" value={form.meetingLink}
                                    onChange={(e) => set("meetingLink", e.target.value)}
                                    placeholder="https://meet.google.com/…"
                                    required={form.mode === "ONLINE"} />
                            </div>
                        )}

                        {["PHYSICAL", "HYBRID"].includes(form.mode) && (
                            <div className="form-field" style={{ marginBottom: 0 }}>
                                <label className="form-label">Location {form.mode === "PHYSICAL" ? "*" : "(optional)"}</label>
                                <input className="form-input" value={form.location}
                                    onChange={(e) => set("location", e.target.value)}
                                    placeholder="Room 204, Library…"
                                    required={form.mode === "PHYSICAL"} />
                            </div>
                        )}

                        <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label">
                                Min Confirmations to Auto-Confirm&nbsp;
                                <strong style={{ color: "var(--color-primary-500)" }}>({form.minConfirmations})</strong>
                            </label>
                            <input type="range" min={1} max={Math.max(memberCount, 1)}
                                value={form.minConfirmations}
                                onChange={(e) => set("minConfirmations", parseInt(e.target.value))}
                                style={{ width: "100%", accentColor: "var(--color-primary-500)" }} />
                            <span className="form-hint">
                                Auto-confirms when {form.minConfirmations} member{form.minConfirmations !== 1 ? "s" : ""} vote YES
                            </span>
                        </div>

                        {err && <p style={{ color: "var(--color-error)", fontSize: "var(--font-size-sm)", margin: 0 }}>{err}</p>}
                    </form>
                </div>

                <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button type="submit" form="meetup-form" className="btn btn-primary" disabled={busy}>
                        {busy ? "Creating…" : <><Calendar size={16} /> Create Meetup</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   MEETUPS TAB
═══════════════════════════════════════════════════════════ */
function MeetupsTab({ groupId, isAdmin, currentUser, memberCount, meetups, meetupsLoading, onSchedule }) {
    const [showPast, setShowPast] = useState(false);

    const upcoming = meetups.filter((m) => !["Completed", "Cancelled"].includes(m.status));
    const past = meetups.filter((m) => ["Completed", "Cancelled"].includes(m.status));

    return (
        <div className="meetups-tab-container fade-in">
            {/* Header */}
            <div className="mt-header">
                <div>
                    <h3 className="mt-title">Group Meetups</h3>
                    <p className="mt-sub">
                        Schedule hybrid meetups and poll the group in real time · {meetups.length} scheduled
                    </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={onSchedule}>
                    <Plus size={16} /> Schedule Meetup
                </button>
            </div>

            {meetupsLoading && meetups.length === 0 ? (
                <LoadingSpinner text="Loading meetups…" />
            ) : meetups.length === 0 ? (
                <div className="ft-empty">
                    <div className="ft-empty-icon"><Calendar size={48} strokeWidth={1} /></div>
                    <h4 className="ft-empty-title">No meetups yet</h4>
                    <p className="ft-empty-sub">
                        Schedule the group's first hybrid meetup and poll members for attendance
                    </p>
                    <button className="btn btn-primary" onClick={onSchedule}>
                        <Plus size={16} /> Schedule First Meetup
                    </button>
                </div>
            ) : (
                <>
                    {/* Upcoming */}
                    {upcoming.length > 0 && (
                        <>
                            <div className="mt-section-label">Upcoming ({upcoming.length})</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {upcoming.map((m) => (
                                    <MeetupCard key={m._id} meetup={m} isAdmin={isAdmin}
                                        currentUserId={currentUser?._id} groupId={groupId} />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Past (collapsed by default) */}
                    {past.length > 0 && (
                        <>
                            <button className="mt-past-toggle" onClick={() => setShowPast((p) => !p)}>
                                {showPast ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {showPast ? "Hide" : "Show"} past meetups ({past.length})
                            </button>
                            {showPast && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, opacity: .8 }}>
                                    {past.map((m) => (
                                        <MeetupCard key={m._id} meetup={m} isAdmin={isAdmin}
                                            currentUserId={currentUser?._id} groupId={groupId} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   MAIN GroupDetail PAGE
═══════════════════════════════════════════════════════════ */
const GroupDetail = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const socket = getSocket();

    const { currentGroup, isLoading: groupLoading } = useSelector((s) => s.groups);
    const { user } = useSelector((s) => s.auth);
    const meetupsState = useSelector((s) => s.meetups.byGroupId[groupId]);
    const meetups = meetupsState?.items || [];

    const searchParams = new URLSearchParams(location.search);
    const [activeTab, setActiveTab] = useState(
        location.state?.tab || searchParams.get("tab") || "chat"
    );
    const [showCreateMeetup, setShowCreateMeetup] = useState(false);

    // ── Fetch on mount ────────────────────────────────────────
    useEffect(() => {
        dispatch(fetchGroupById(groupId));
        dispatch(fetchGroupMeetups(groupId));
        joinSocketRoom(groupId);
        return () => {
            leaveSocketRoom(groupId);
        };
    }, [dispatch, groupId]);

    // ── Socket: real-time meetup updates ─────────────────────
    useEffect(() => {
        if (!socket) return;
        const onCreated = (data) => dispatch(meetupCreatedRealtime(data));
        const onChanged = (data) => dispatch(meetupStatusChangedRealtime(data));
        const onVoted = (data) => dispatch(meetupVotedRealtime(data));
        socket.on("group-meetup:created", onCreated);
        socket.on("group-meetup:status-changed", onChanged);
        socket.on("group-meetup:voted", onVoted);
        return () => {
            socket.off("group-meetup:created", onCreated);
            socket.off("group-meetup:status-changed", onChanged);
            socket.off("group-meetup:voted", onVoted);
        };
    }, [socket, dispatch]);

    // ── Computed ──────────────────────────────────────────────
    const isAdmin = !!(
        currentGroup?.creator === user?._id ||
        currentGroup?.creator?._id?.toString() === user?._id ||
        currentGroup?.admins?.some((a) => (a._id || a)?.toString() === user?._id) ||
        currentGroup?.members?.some((m) => {
            const uid = m.user?._id || m.user;
            return uid?.toString() === user?._id && m.role === "admin";
        })
    );
    const memberCount = currentGroup?.members?.length || 0;
    const isPrivate = currentGroup && !currentGroup.isPublic;
    const activeMeetups = meetups.filter((m) => m.status === "Active").length;

    // ── Handlers ──────────────────────────────────────────────
    const handleLeave = async () => {
        const ok = await confirmAction("Leave this group?", { confirmText: "Leave" });
        if (!ok) return;
        await dispatch(leaveGroupAction(groupId));
        navigate("/groups");
    };

    const handleDelete = async () => {
        const ok = await confirmAction("Delete this group? This cannot be undone.", { confirmText: "Delete", isDanger: true });
        if (!ok) return;
        await groupService.deleteGroup(groupId);
        navigate("/groups");
    };

    // ── Loading / not found states ────────────────────────────
    if (groupLoading && !currentGroup) return (
        <div className="db-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LoadingSpinner text="Loading group…" />
        </div>
    );

    if (!currentGroup) return (
        <div className="db-root" style={{ minHeight: "100vh", padding: "2rem" }}>
            <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>
                <AlertTriangle size={48} style={{ color: "var(--color-error)", marginBottom: "1rem" }} />
                <h2 style={{ color: "var(--text)" }}>Group not found</h2>
                <p style={{ color: "var(--text-dim)", marginBottom: "1.5rem" }}>
                    This group may have been deleted or you don't have access.
                </p>
                <button className="btn btn-primary" onClick={() => navigate("/groups")}>
                    <ArrowLeft size={16} /> Back to Groups
                </button>
            </div>
        </div>
    );

    const tabs = [
        { id: "chat", label: "Chat", Icon: MessageSquare, badge: 0 },
        { id: "meetups", label: "Meetups", Icon: Calendar, badge: activeMeetups },
        { id: "files", label: "Files", Icon: File, badge: 0 },
        { id: "members", label: "Members", Icon: Users, badge: memberCount },
    ];

    // Upcoming meetups summary for sidebar
    const upcomingMeetup = meetups.find((m) => ["Active", "Confirmed", "Draft"].includes(m.status));

    return (
        <div className="db-root gd-workspace">
            {/* ── Sticky header ── */}
            <div className="gd-header" style={{ top: 0 }}>
                <button className="gd-back-btn" onClick={() => navigate("/groups")}>
                    <ArrowLeft size={15} /> Groups
                </button>

                <div className="gd-header-info">
                    <div className="gd-header-name">
                        {currentGroup.name}
                        {isPrivate && (
                            <span style={{
                                fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                                background: "rgba(245,158,11,.12)", color: "#fbbf24",
                                border: "1px solid rgba(245,158,11,.25)",
                            }}>
                                <Lock size={10} /> Private
                            </span>
                        )}
                    </div>
                    <div className="gd-header-meta">
                        <span style={{ color: "var(--bio)", fontWeight: 600 }}>{memberCount} members</span>
                        {currentGroup.subject && <span style={{ margin: "0 6px", color: "var(--text-dim)" }}>·</span>}
                        {currentGroup.subject && <span>{currentGroup.subject}</span>}
                        {currentGroup.courseCode && (
                            <span style={{ marginLeft: 4, color: "var(--text-dim)" }}>({currentGroup.courseCode})</span>
                        )}
                    </div>
                </div>

                <div className="gd-header-actions">
                    {isAdmin ? (
                        <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                            <Trash2 size={14} /> Delete
                        </button>
                    ) : (
                        <button className="btn btn-secondary btn-sm" onClick={handleLeave}>
                            <LogOut size={14} /> Leave
                        </button>
                    )}
                </div>
            </div>

            {/* ── Body: main + sidebar ── */}
            <div className="gd-body">
                {/* ── Left: tabs + content ── */}
                <div>
                    {/* Tabs */}
                    <div className="gd-tabs">
                        {tabs.map((tab) => (
                            <button key={tab.id}
                                className={`gd-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                                onClick={() => setActiveTab(tab.id)}>
                                <tab.Icon size={15} />
                                <span>{tab.label}</span>
                                {tab.badge > 0 && (
                                    <span className="gd-tab-badge">{tab.badge}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    {activeTab === "chat" && (
                        <ChatTab groupId={groupId} />
                    )}

                    {activeTab === "meetups" && (
                        <MeetupsTab
                            groupId={groupId}
                            isAdmin={isAdmin}
                            currentUser={user}
                            memberCount={memberCount}
                            meetups={meetups}
                            meetupsLoading={meetupsState?.loading}
                            onSchedule={() => setShowCreateMeetup(true)}
                        />
                    )}

                    {activeTab === "files" && (
                        <FilesTab
                            groupId={groupId}
                            currentUserId={user?._id}
                            isAdmin={isAdmin}
                        />
                    )}

                    {activeTab === "members" && (
                        <MemberList
                            group={currentGroup}
                            currentUser={user}
                            groupId={groupId}
                            isAdmin={isAdmin}
                        />
                    )}
                </div>

                {/* ── Right: sidebar ── */}
                <aside className="gd-sidebar">
                    {/* Group info card */}
                    <div className="gd-side-card">
                        <div className="gd-side-title">
                            <Users size={13} /> Group Info
                        </div>
                        <div className="gd-quick-stat">
                            <span className="gd-quick-stat-label">Members</span>
                            <span className="gd-quick-stat-val" style={{ color: "var(--bio)" }}>{memberCount}</span>
                        </div>
                        {currentGroup.subject && (
                            <div className="gd-quick-stat">
                                <span className="gd-quick-stat-label">Subject</span>
                                <span className="gd-quick-stat-val">{currentGroup.subject}</span>
                            </div>
                        )}
                        {currentGroup.courseCode && (
                            <div className="gd-quick-stat">
                                <span className="gd-quick-stat-label">Course</span>
                                <span className="gd-quick-stat-val">{currentGroup.courseCode}</span>
                            </div>
                        )}
                        <div className="gd-quick-stat">
                            <span className="gd-quick-stat-label">Visibility</span>
                            <span className="gd-quick-stat-val">
                                {isPrivate ? "🔒 Private" : "🌐 Public"}
                            </span>
                        </div>
                        {currentGroup.settings?.maxMembers && (
                            <div className="gd-quick-stat">
                                <span className="gd-quick-stat-label">Max Members</span>
                                <span className="gd-quick-stat-val">{currentGroup.settings.maxMembers}</span>
                            </div>
                        )}
                    </div>

                    {/* Meetup quick summary */}
                    <div className="gd-side-card">
                        <div className="gd-side-title">
                            <Calendar size={13} /> Meetups
                        </div>
                        <div className="gd-quick-stat">
                            <span className="gd-quick-stat-label">Total</span>
                            <span className="gd-quick-stat-val">{meetups.length}</span>
                        </div>
                        <div className="gd-quick-stat">
                            <span className="gd-quick-stat-label">Active</span>
                            <span className="gd-quick-stat-val" style={{ color: "#818cf8" }}>
                                {meetups.filter((m) => m.status === "Active").length}
                            </span>
                        </div>
                        <div className="gd-quick-stat">
                            <span className="gd-quick-stat-label">Confirmed</span>
                            <span className="gd-quick-stat-val" style={{ color: "#34d399" }}>
                                {meetups.filter((m) => m.status === "Confirmed").length}
                            </span>
                        </div>
                        {upcomingMeetup && (
                            <div style={{
                                marginTop: 10, padding: "8px 10px", borderRadius: "var(--r-md)",
                                background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)",
                            }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc", marginBottom: 3 }}>
                                    NEXT MEETUP
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                                    {upcomingMeetup.title}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                                    <Clock size={10} style={{ display: "inline", marginRight: 3 }} />
                                    {upcomingMeetup.time} · {new Date(upcomingMeetup.meetingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </div>
                            </div>
                        )}
                        <button className="btn btn-sm btn-secondary" style={{ width: "100%", marginTop: 10 }}
                            onClick={() => { setActiveTab("meetups"); setShowCreateMeetup(true); }}>
                            <Plus size={13} /> Schedule Meetup
                        </button>
                    </div>

                    {/* Tags */}
                    {currentGroup.tags?.length > 0 && (
                        <div className="gd-side-card">
                            <div className="gd-side-title">
                                <span>Tags</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {currentGroup.tags.map((tag, i) => (
                                    <span key={i} style={{
                                        display: "inline-block", padding: "3px 9px", fontSize: 11, fontWeight: 600,
                                        background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)",
                                        borderRadius: 4, color: "#a5b4fc",
                                    }}>#{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {currentGroup.description && (
                        <div className="gd-side-card">
                            <div className="gd-side-title">About</div>
                            <p style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.65 }}>
                                {currentGroup.description}
                            </p>
                        </div>
                    )}
                </aside>
            </div>

            {/* Create Meetup Modal */}
            {showCreateMeetup && (
                <CreateMeetupModal
                    groupId={groupId}
                    memberCount={memberCount}
                    onClose={() => setShowCreateMeetup(false)}
                />
            )}
        </div>
    );
};

export default GroupDetail;
