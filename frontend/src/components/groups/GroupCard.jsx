import { useState } from "react";
import {
  Users, Lock, Globe, BookOpen, Hash, Tag, Calendar,
  ChevronRight, UserPlus, ArrowRight,
} from "lucide-react";

/**
 * Rich group card: Notion/Slack-inspired, uses existing CSS classes
 * (grp-card, hover-glow, card-shine from Groups.css/Dashboard.css)
 * plus new .gc-* classes from groups.extra.css.
 */
function GroupCard({ group, currentUserId, onJoin, onOpen, joining, nextMeetup }) {
  const [hovered, setHovered] = useState(false);

  const isMember = group.members?.some((m) => {
    const uid = m.user?._id || m.user;
    return uid?.toString() === currentUserId;
  });

  const memberCount = group.members?.length || 0;
  const isPrivate = !group.isPublic;

  // Tag colors cycling
  const tagColors = [
    { bg: "rgba(99,102,241,.13)", color: "#818cf8", border: "rgba(99,102,241,.22)" },
    { bg: "rgba(168,85,247,.13)", color: "#c084fc", border: "rgba(168,85,247,.22)" },
    { bg: "rgba(6,182,212,.13)", color: "#22d3ee", border: "rgba(6,182,212,.22)" },
    { bg: "rgba(16,185,129,.13)", color: "#34d399", border: "rgba(16,185,129,.22)" },
    { bg: "rgba(245,158,11,.13)", color: "#fbbf24", border: "rgba(245,158,11,.22)" },
  ];

  // Gradient per group (deterministic from name)
  const gradients = [
    "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)",
    "linear-gradient(135deg,#06b6d4 0%,#3b82f6 100%)",
    "linear-gradient(135deg,#a855f7 0%,#ec4899 100%)",
    "linear-gradient(135deg,#10b981 0%,#06b6d4 100%)",
    "linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)",
  ];
  const gIdx = group.name ? (group.name.charCodeAt(0) % gradients.length) : 0;
  const gradient = gradients[gIdx];

  const formatMeetupDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d - now;
    if (diff < 0) return null;
    if (diff < 24 * 3600 * 1000) return "Today";
    if (diff < 48 * 3600 * 1000) return "Tomorrow";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const meetupLabel = nextMeetup ? formatMeetupDate(nextMeetup.meetingDate) : null;

  return (
    <div
      className="gc-card grp-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: isMember ? "pointer" : "default" }}
      onClick={() => isMember && onOpen(group._id)}
    >
      {/* Gradient accent bar */}
      <div className="gc-accent" style={{ background: gradient }} />

      {/* Shine overlay on hover */}
      {hovered && <div className="gc-shine" />}

      {/* Header */}
      <div className="gc-header">
        <div className="gc-icon" style={{ background: gradient }}>
          <Users size={18} color="#fff" />
        </div>
        <div className="gc-header-right">
          {meetupLabel && (
            <span className="gc-meetup-badge">
              <Calendar size={10} />
              {meetupLabel} {nextMeetup?.time || ""}
            </span>
          )}
          <span className={`gc-visibility ${isPrivate ? "gc-visibility--private" : "gc-visibility--public"}`}>
            {isPrivate
              ? <><Lock size={10} /> Private</>
              : <><Globe size={10} /> Public</>
            }
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="gc-title" title={group.name}>{group.name}</h3>

      {/* Meta row */}
      <div className="gc-meta">
        {group.courseCode && (
          <span className="gc-meta-pill">
            <BookOpen size={10} /> {group.courseCode}
          </span>
        )}
        {group.subject && (
          <span className="gc-meta-pill">
            <Hash size={10} /> {group.subject}
          </span>
        )}
        <span className="gc-meta-pill">
          <Users size={10} /> {memberCount} member{memberCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Description */}
      {group.description && (
        <p className="gc-desc">{group.description}</p>
      )}

      {/* Tags */}
      {group.tags?.length > 0 && (
        <div className="gc-tags">
          {group.tags.slice(0, 4).map((tag, i) => {
            const tc = tagColors[i % tagColors.length];
            return (
              <span key={i} className="gc-tag"
                style={{ background: tc.bg, color: tc.color, borderColor: tc.border }}>
                <Tag size={9} /> {tag}
              </span>
            );
          })}
          {group.tags.length > 4 && (
            <span className="gc-tag" style={{ background: "rgba(148,163,184,.1)", color: "var(--color-text-tertiary)", borderColor: "rgba(148,163,184,.2)" }}>
              +{group.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="gc-footer">
        {isMember ? (
          <button
            className="gc-btn gc-btn--open"
            onClick={(e) => { e.stopPropagation(); onOpen(group._id); }}
          >
            Open Group <ChevronRight size={15} />
          </button>
        ) : isPrivate ? (
          <span className="gc-locked">
            <Lock size={12} /> Invitation only
          </span>
        ) : (
          <button
            className="gc-btn gc-btn--join"
            disabled={joining[group._id]}
            onClick={(e) => { e.stopPropagation(); onJoin(group._id); }}
          >
            {joining[group._id]
              ? "Joining…"
              : <><UserPlus size={14} /> Join Group</>
            }
          </button>
        )}

        {isMember && (
          <span className="gc-member-badge">
            <span className="gc-pulse-dot" /> Member
          </span>
        )}
      </div>
    </div>
  );
}

export default GroupCard;
