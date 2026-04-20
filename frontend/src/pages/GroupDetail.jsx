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
import {
    pollCreatedRealtime, pollUpdatedRealtime, pollDeletedRealtime, pollVotedRealtime
} from "../features/polls/pollSlice";
import { joinGroup as joinSocketRoom, leaveGroup as leaveSocketRoom, getSocket } from "../socket/socket";
import * as groupService from "../services/groupService";
import {
    ArrowLeft, Users, MessageSquare, File, Calendar,
    Plus, X, Clock, Zap, Globe, Navigation, Shuffle,
    Award, Lock, Trash2, LogOut, Waves,
    Home as HomeIcon, Brain, BookMarked, Video, LayoutDashboard,
    ChevronDown, ChevronUp, AlertTriangle, Mail, Activity, Tag, BarChart2
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import StudentDashboardShell from "../components/StudentDashboardShell";
import { useTheme } from "../context/ThemeContext";
import ChatTab from "../components/groups/ChatTab";
import MeetupCard from "../components/groups/MeetupCard";
import FilesTab from "../components/groups/FilesTab";
import MemberList from "../components/groups/MemberList";
import InvitesTab from "../components/groups/InvitesTab";
import ActivityTab from "../components/groups/ActivityTab";
import PollsTab from "../components/groups/PollsTab";
import { confirmAction } from "../utils/toast";
import "../styles/Dashboard.css";
import "../styles/Groups.css";
import "../styles/GroupsExtra.css";
import "../styles/Notifications.css";

/* ═══════════════════════════════════════════════════════════
   CREATE MEETUP MODAL
═══════════════════════════════════════════════════════════ */
// Form to schedule a new meeting (online or physical)
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
        if (form.mode === "HYBRID" && (!form.location || !form.meetingLink)) return setErr("Both location and meeting link are required for hybrid meetups");
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
                        <span className="modal-icon-box">
                            <Calendar size={18} strokeWidth={1.75} />
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
                                        className={`grp-form-seg ${form.mode === val ? "grp-form-seg--active" : ""}`}
                                    >
                                        <Icon size={13} strokeWidth={1.75} /> {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {["ONLINE", "HYBRID"].includes(form.mode) && (
                            <div className="form-field" style={{ marginBottom: 0 }}>
                                <label className="form-label">Meeting Link *</label>
                                <input className="form-input" value={form.meetingLink}
                                    onChange={(e) => set("meetingLink", e.target.value)}
                                    placeholder="https://meet.google.com/…"
                                    required={["ONLINE", "HYBRID"].includes(form.mode)} />
                            </div>
                        )}

                        {["PHYSICAL", "HYBRID"].includes(form.mode) && (
                            <div className="form-field" style={{ marginBottom: 0 }}>
                                <label className="form-label">Location *</label>
                                <input className="form-input" value={form.location}
                                    onChange={(e) => set("location", e.target.value)}
                                    placeholder="Room 204, Library…"
                                    required={["PHYSICAL", "HYBRID"].includes(form.mode)} />
                            </div>
                        )}

                        <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label">
                                Min Confirmations to Auto-Confirm&nbsp;
                                <strong style={{ color: "var(--bio, #2ecc71)" }}>({form.minConfirmations})</strong>
                            </label>
                            <input type="range" min={1} max={Math.max(memberCount, 1)}
                                value={form.minConfirmations}
                                onChange={(e) => set("minConfirmations", parseInt(e.target.value))}
                                style={{ width: "100%", accentColor: "var(--ds-accent, #2ecc71)" }} />
                            <span className="form-hint">
                                Auto-confirms when {form.minConfirmations} member{form.minConfirmations !== 1 ? "s" : ""} vote YES
                            </span>
                        </div>

                        {err && <p style={{ color: "var(--color-error)", fontSize: "var(--font-size-sm)", margin: 0 }}>{err}</p>}
                    </form>
                </div>

                <div className="modal-actions">
                    <button type="button" className="grp-btn-secondary" onClick={onClose}>Cancel</button>
                    <button type="submit" form="meetup-form" className="grp-btn-primary" disabled={busy}>
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
        <div className="meetups-tab-container">
            {/* Header */}
            <div className="mt-header">
                <div>
                    <h3 className="mt-title">Group Meetups</h3>
                    <p className="mt-sub">
                        Schedule hybrid meetups and poll the group in real time · {meetups.length} scheduled
                    </p>
                </div>
                <button className="grp-btn-primary grp-btn-sm" onClick={onSchedule}>
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
                    <button className="grp-btn-primary" onClick={onSchedule}>
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
// This is the big page that shows chat, polls, and everything for a specific group
const GroupDetail = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
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

    // Listen for real-time socket updates (someone votes, new poll, etc)
    useEffect(() => {
        if (!socket) return;
        const onCreated = (data) => dispatch(meetupCreatedRealtime(data));
        const onChanged = (data) => dispatch(meetupStatusChangedRealtime(data));
        const onVoted = (data) => dispatch(meetupVotedRealtime(data));

        const onPollCreated = (data) => dispatch(pollCreatedRealtime(data));
        const onPollUpdated = (data) => dispatch(pollUpdatedRealtime(data));
        const onPollDeleted = (pollId) => dispatch(pollDeletedRealtime({ pollId, groupId }));
        const onPollVoted = (data) => dispatch(pollVotedRealtime(data));

        socket.on("group-meetup:created", onCreated);
        socket.on("group-meetup:status-changed", onChanged);
        socket.on("group-meetup:voted", onVoted);

        socket.on("group-poll:created", onPollCreated);
        socket.on("group-poll:updated", onPollUpdated);
        socket.on("group-poll:deleted", onPollDeleted);
        socket.on("group-poll:voted", onPollVoted);

        return () => {
            socket.off("group-meetup:created", onCreated);
            socket.off("group-meetup:status-changed", onChanged);
            socket.off("group-meetup:voted", onVoted);

            socket.off("group-poll:created", onPollCreated);
            socket.off("group-poll:updated", onPollUpdated);
            socket.off("group-poll:deleted", onPollDeleted);
            socket.off("group-poll:voted", onPollVoted);
        };
    }, [socket, dispatch, groupId]);

    // Figure out if the current user is an admin here
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

    const handleBack = () => {
        // If we came from a deep link, we might not have history.
        if (window.history.length > 2 && location.key !== "default") {
            navigate(-1);
        } else {
            navigate("/groups");
        }
    };

    // ── Loading / not found states ────────────────────────────
    if (groupLoading && !currentGroup) return (
        <StudentDashboardShell>
            <div className="dashboard-loading" data-theme={theme}>
                <LoadingSpinner text="Loading group…" />
            </div>
        </StudentDashboardShell>
    );

    if (!currentGroup) return (
        <StudentDashboardShell>
            <div className="grp-root gdetail-page" style={{ minHeight: "70vh", padding: "2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
                    <AlertTriangle size={48} style={{ color: "var(--color-error)", marginBottom: "1rem" }} />
                    <h2 style={{ color: "var(--text)" }}>Group not found</h2>
                    <p style={{ color: "var(--text-dim)", marginBottom: "1.5rem" }}>
                        This group may have been deleted or you don&apos;t have access.
                    </p>
                    <button type="button" className="grp-btn-primary" onClick={() => navigate("/groups")}>
                        <ArrowLeft size={16} /> Back to Groups
                    </button>
                </div>
            </div>
        </StudentDashboardShell>
    );

    const tabs = [
        { id: "chat", label: "Chat", Icon: MessageSquare, badge: 0 },
        { id: "polls", label: "Polls", Icon: BarChart2, badge: 0 },
        { id: "meetups", label: "Meetups", Icon: Calendar, badge: activeMeetups },
        { id: "files", label: "Files", Icon: File, badge: 0 },
        { id: "members", label: "Members", Icon: Users, badge: memberCount },
        ...(isAdmin ? [{ id: "invites", label: "Invites", Icon: Mail, badge: 0 }] : []),
        { id: "activity", label: "Activity", Icon: Activity, badge: 0 },
    ];

    // Upcoming meetups summary for sidebar
    const upcomingMeetup = meetups.find((m) => ["Active", "Confirmed", "Draft"].includes(m.status));

    return (
        <StudentDashboardShell>
            <div className="db-root grp-root gdetail-page">
                {/* ── Cinematic Hero Header ── */}
                <div className="gdetail-hero">
                    <div className="gdetail-hero-inner">
                        <div className="gdetail-breadcrumbs">
                            <button className="gdetail-back-btn" onClick={handleBack} aria-label="Go back">
                                <ArrowLeft size={14} /> {window.history.length > 2 ? "Back" : "Back to Groups"}
                            </button>
                            <span className="gdetail-crumb-sep">/</span>
                            <Link to="/groups" className="gdetail-crumb-link">Groups</Link>
                            <span className="gdetail-crumb-sep">/</span>
                            <span className="gdetail-crumb-current">{currentGroup.name}</span>
                        </div>

                        <div className="gdetail-hero-main">
                            <div className="gdetail-title-block">
                                <h1 className="gdetail-title">
                                    {currentGroup.name}
                                    {isPrivate ? (
                                        <span className="gdetail-badge gdetail-badge--private"><Lock size={12} /> Private</span>
                                    ) : (
                                        <span className="gdetail-badge gdetail-badge--public"><Globe size={12} /> Public</span>
                                    )}
                                </h1>
                                <div className="gdetail-meta-row">
                                    <span className="gdetail-meta-stat"><Users size={14} /> {memberCount} Members</span>
                                    {currentGroup.subject && (
                                        <>
                                            <span className="gdetail-meta-dot">·</span>
                                            <span className="gdetail-meta-stat"><Tag size={14} /> {currentGroup.subject}</span>
                                        </>
                                    )}
                                    {currentGroup.courseCode && (
                                        <>
                                            <span className="gdetail-meta-dot">·</span>
                                            <span className="gdetail-meta-stat"><BookMarked size={14} /> {currentGroup.courseCode}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="gdetail-hero-actions">
                                {isAdmin ? (
                                    <button className="grp-btn-danger" onClick={handleDelete}>
                                        <Trash2 size={16} /> <span className="hide-on-mobile">Disband Group</span>
                                    </button>
                                ) : (
                                    <button className="grp-btn-secondary" onClick={handleLeave}>
                                        <LogOut size={16} /> <span className="hide-on-mobile">Leave Group</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Decorative Ambient Shapes */}
                    <div className="gdetail-ambient-1"></div>
                    <div className="gdetail-ambient-2"></div>
                </div>

                {/* ── Main Container ── */}
                <div className="gdetail-container">

                    {/* ── Integrated Segmented Navigation ── */}
                    <div className="gdetail-nav-scroll">
                        <nav className="gdetail-nav-bar">
                            {tabs.map((tab) => (
                                <button key={tab.id}
                                    className={`gdetail-nav-tab ${activeTab === tab.id ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab.id)}>
                                    <tab.Icon size={16} className="gdetail-nav-icon" />
                                    <span>{tab.label}</span>
                                    {tab.badge > 0 && (
                                        <span className="gdetail-tab-badge">{tab.badge}</span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* ── Bento Content Grid ── */}
                    <div className="gdetail-bento-grid">

                        {/* Left: Tab Content */}
                        <div className="gdetail-content-panel">
                            {activeTab === "chat" && <ChatTab groupId={groupId} />}
                            {activeTab === "polls" && (
                                <PollsTab groupId={groupId} isAdmin={isAdmin} currentUser={user} />
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
                                <FilesTab groupId={groupId} currentUserId={user?._id} isAdmin={isAdmin} />
                            )}
                            {activeTab === "members" && (
                                <MemberList group={currentGroup} currentUser={user} groupId={groupId} isAdmin={isAdmin} />
                            )}
                            {activeTab === "invites" && (
                                <InvitesTab groupId={groupId} isAdmin={isAdmin} currentUser={user} />
                            )}
                            {activeTab === "activity" && (
                                <ActivityTab groupId={groupId} />
                            )}
                        </div>

                        {/* Right: Contextual Floating Sidebar */}
                        <aside className="gdetail-context-sidebar">

                            {/* About Panel */}
                            <div className="gdetail-side-panel">
                                <h3 className="gdetail-panel-title"><Award size={14} /> Group Context</h3>
                                {currentGroup.description ? (
                                    <p className="gdetail-panel-desc">{currentGroup.description}</p>
                                ) : (
                                    <p className="gdetail-panel-desc" style={{ fontStyle: "italic", opacity: 0.7 }}>No description provided.</p>
                                )}

                                <div className="gdetail-divider"></div>

                                <div className="gdetail-stat-row">
                                    <span className="gdetail-stat-lbl">Capacity</span>
                                    <span className="gdetail-stat-val">{memberCount} / {currentGroup.settings?.maxMembers || "∞"}</span>
                                </div>
                                <div className="gdetail-stat-row">
                                    <span className="gdetail-stat-lbl">Status</span>
                                    <span className="gdetail-stat-val" style={{ color: "var(--color-success)" }}>Active</span>
                                </div>

                                {/* Tags */}
                                {currentGroup.tags?.length > 0 && (
                                    <div className="gdetail-side-tags" style={{ marginTop: 16 }}>
                                        {currentGroup.tags.map((tag, i) => (
                                            <span key={i} className="gdetail-chip">#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Meetups Snapshot Panel */}
                            <div className="gdetail-side-panel">
                                <h3 className="gdetail-panel-title"><Calendar size={14} /> Meetup Snapshot</h3>

                                <div className="gdetail-stat-row">
                                    <span className="gdetail-stat-lbl">Total Sessions</span>
                                    <span className="gdetail-stat-val">{meetups.length}</span>
                                </div>
                                <div className="gdetail-stat-row">
                                    <span className="gdetail-stat-lbl">Active/Upcoming</span>
                                    <span className="gdetail-stat-val" style={{ color: "var(--cyan)" }}>
                                        {meetups.filter((m) => m.status === "Active" || m.status === "Confirmed").length}
                                    </span>
                                </div>

                                {upcomingMeetup && (
                                    <div className="gdetail-upcoming-feature">
                                        <div className="gdetail-uf-lbl">NEXT UP</div>
                                        <div className="gdetail-uf-title">{upcomingMeetup.title}</div>
                                        <div className="gdetail-uf-time">
                                            <Clock size={12} /> {upcomingMeetup.time} · {new Date(upcomingMeetup.meetingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </div>
                                    </div>
                                )}

                                <button className="gdetail-uf-btn" onClick={() => { setActiveTab("meetups"); setShowCreateMeetup(true); }}>
                                    <Plus size={14} /> Schedule New
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>

                {/* Modal */}
                {showCreateMeetup && (
                    <CreateMeetupModal
                        groupId={groupId}
                        memberCount={memberCount}
                        onClose={() => setShowCreateMeetup(false)}
                    />
                )}
            </div>
        </StudentDashboardShell>
    );
};

export default GroupDetail;
