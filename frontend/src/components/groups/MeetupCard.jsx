import { useState } from "react";
import { useDispatch } from "react-redux";
import {
    Calendar, Clock, Zap, CheckCircle2, XCircle, Award,
    MapPin, Link2, Globe, Navigation, Shuffle,
    ChevronDown, ChevronUp,
} from "lucide-react";
import {
    activateMeetup, voteOnMeetup, completeMeetup,
} from "../../features/meetups/meetupSlice";

// ── Status configuration ───────────────────────────────────────
const STATUS = {
    Draft: {
        label: "Draft",
        icon: <Clock size={12} />,
        style: { bg: "rgba(100,116,139,.15)", color: "#94a3b8", border: "rgba(100,116,139,.25)" },
        barColor: "#64748b",
    },
    Active: {
        label: "Voting Open",
        icon: <Zap size={12} />,
        style: { bg: "rgba(99,102,241,.15)", color: "#818cf8", border: "rgba(99,102,241,.3)" },
        barColor: "#6366f1",
    },
    Confirmed: {
        label: "Confirmed",
        icon: <CheckCircle2 size={12} />,
        style: { bg: "rgba(16,185,129,.15)", color: "#34d399", border: "rgba(16,185,129,.3)" },
        barColor: "#10b981",
    },
    Cancelled: {
        label: "Cancelled",
        icon: <XCircle size={12} />,
        style: { bg: "rgba(239,68,68,.15)", color: "#f87171", border: "rgba(239,68,68,.25)" },
        barColor: "#ef4444",
    },
    Completed: {
        label: "Completed",
        icon: <Award size={12} />,
        style: { bg: "rgba(168,85,247,.15)", color: "#c084fc", border: "rgba(168,85,247,.3)" },
        barColor: "#a855f7",
    },
};

const MODE_ICON = {
    ONLINE: <Globe size={12} />,
    PHYSICAL: <Navigation size={12} />,
    HYBRID: <Shuffle size={12} />,
};

// ── MeetupCard ─────────────────────────────────────────────────
function MeetupCard({ meetup, isAdmin, currentUserId, groupId }) {
    const dispatch = useDispatch();
    const [expanded, setExpanded] = useState(false);
    const [busy, setBusy] = useState(null);

    const cfg = STATUS[meetup.status] || STATUS.Draft;
    const votes = meetup.votes || [];
    const yesCount = meetup.yesCount ?? votes.filter((v) => v.response === "YES").length;
    const noCount = meetup.noCount ?? votes.filter((v) => v.response === "NO").length;
    const userVote = votes.find((v) => {
        const vid = v.user?._id || v.user;
        return vid?.toString() === currentUserId?.toString();
    });
    const minConf = meetup.minConfirmations || 1;
    const progress = Math.min(100, Math.round((yesCount / minConf) * 100));

    const d = new Date(meetup.meetingDate);
    const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const day = d.getDate();

    const act = async (key) => {
        if (busy) return;
        setBusy(key);
        try {
            if (key === "activate") await dispatch(activateMeetup({ meetupId: meetup._id, groupId })).unwrap();
            if (key === "yes") await dispatch(voteOnMeetup({ meetupId: meetup._id, groupId, response: "YES" })).unwrap();
            if (key === "no") await dispatch(voteOnMeetup({ meetupId: meetup._id, groupId, response: "NO" })).unwrap();
            if (key === "complete") await dispatch(completeMeetup({ meetupId: meetup._id, groupId })).unwrap();
        } catch (e) { console.error(e); }
        finally { setBusy(null); }
    };

    return (
        <div className="mc-card" style={{ borderLeftColor: cfg.barColor }}>
            {/* ── Collapsed header ── */}
            <div className="mc-header" onClick={() => setExpanded((p) => !p)}>
                {/* Date block */}
                <div className="mc-date-block">
                    <span className="mc-date-month">{month}</span>
                    <span className="mc-date-day">{day}</span>
                </div>

                {/* Title + meta */}
                <div className="mc-info">
                    <h4 className="mc-title">{meetup.title}</h4>
                    <div className="mc-meta-row">
                        <span className="mc-mode-badge">
                            {MODE_ICON[meetup.mode] || <Globe size={12} />}
                            {meetup.mode}
                        </span>
                        <span className="mc-time">
                            <Clock size={11} /> {meetup.time}
                            {" · "}
                            {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        {["Active", "Confirmed"].includes(meetup.status) && (
                            <span className="mc-confirmations" style={{ color: cfg.barColor }}>
                                {yesCount}/{minConf} ✓
                            </span>
                        )}
                    </div>
                </div>

                {/* Status + toggle */}
                <div className="mc-right">
                    <span className="mc-status-pill"
                        style={{ background: cfg.style.bg, color: cfg.style.color, borderColor: cfg.style.border }}>
                        {cfg.icon} {cfg.label}
                    </span>
                    <span className="mc-chevron">
                        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </span>
                </div>
            </div>

            {/* ── Expanded body ── */}
            {expanded && (
                <div className="mc-body">
                    {meetup.description && (
                        <p className="mc-description">{meetup.description}</p>
                    )}

                    {/* Location / Link */}
                    <div className="mc-details-row">
                        {meetup.location && (
                            <span className="mc-detail-item">
                                <MapPin size={13} /> {meetup.location}
                            </span>
                        )}
                        {meetup.meetingLink && (
                            <a href={meetup.meetingLink} target="_blank" rel="noopener noreferrer"
                                className="mc-detail-item mc-link"
                                onClick={(e) => e.stopPropagation()}>
                                <Link2 size={13} /> Join Online →
                            </a>
                        )}
                    </div>

                    {/* Voting section */}
                    {["Active", "Confirmed"].includes(meetup.status) && (
                        <div className="mc-poll-box">
                            <div className="mc-poll-header">
                                <span className="mc-poll-label">Poll Confirmations</span>
                                <span className="mc-poll-count" style={{ color: cfg.barColor }}>
                                    {yesCount} / {minConf}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="mc-progress-track">
                                <div className="mc-progress-fill"
                                    style={{ width: `${progress}%`, background: cfg.barColor }} />
                            </div>

                            <div className="mc-vote-counts">
                                <span style={{ color: "var(--color-success)" }}>✓ {yesCount} YES</span>
                                <span style={{ color: "var(--color-error)" }}>✕ {noCount} NO</span>
                                <span style={{ color: "var(--color-text-tertiary)" }}>{votes.length} voted</span>
                            </div>

                            {/* Vote buttons — only when Active */}
                            {meetup.status === "Active" && (
                                <div className="mc-vote-btns">
                                    <button
                                        className={`btn btn-sm mc-vote-yes ${userVote?.response === "YES" ? "mc-vote-yes--active" : ""}`}
                                        onClick={(e) => { e.stopPropagation(); act("yes"); }}
                                        disabled={!!busy}
                                    >
                                        {busy === "yes" ? "…" : <><CheckCircle2 size={14} /> YES</>}
                                    </button>
                                    <button
                                        className={`btn btn-sm mc-vote-no ${userVote?.response === "NO" ? "mc-vote-no--active" : ""}`}
                                        onClick={(e) => { e.stopPropagation(); act("no"); }}
                                        disabled={!!busy}
                                    >
                                        {busy === "no" ? "…" : <><XCircle size={14} /> NO</>}
                                    </button>
                                </div>
                            )}

                            {userVote && (
                                <p className="mc-your-vote">
                                    Your vote:{" "}
                                    <strong style={{ color: userVote.response === "YES" ? "var(--color-success)" : "var(--color-error)" }}>
                                        {userVote.response}
                                    </strong>
                                    {meetup.status === "Active" && " · click above to change"}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Admin actions */}
                    {isAdmin && (
                        <div className="mc-admin-actions">
                            {meetup.status === "Draft" && (
                                <button className="btn btn-primary btn-sm"
                                    onClick={(e) => { e.stopPropagation(); act("activate"); }}
                                    disabled={!!busy}>
                                    {busy === "activate" ? "Activating…" : <><Zap size={14} /> Activate Voting</>}
                                </button>
                            )}
                            {["Active", "Confirmed"].includes(meetup.status) && (
                                <button className="btn btn-secondary btn-sm"
                                    onClick={(e) => { e.stopPropagation(); act("complete"); }}
                                    disabled={!!busy}>
                                    {busy === "complete" ? "Completing…" : <><Award size={14} /> Mark Completed</>}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default MeetupCard;
