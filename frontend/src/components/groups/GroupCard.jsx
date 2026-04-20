import { useState } from "react";
import {
  Users, Lock, Globe, BookOpen, Hash, Tag, Calendar,
  ChevronRight, UserPlus,
} from "lucide-react";

/**
 * Group card — dashboard-aligned mint accent, outline icons.
 */
function GroupCard({ group, currentUserId, onJoin, onOpen, joining, nextMeetup }) {
  const [hovered, setHovered] = useState(false);

  const isMember = group.members?.some((m) => {
    const uid = m.user?._id || m.user;
    return uid?.toString() === currentUserId;
  });

  const memberCount = group.members?.length || 0;
  const isPrivate = !group.isPublic;

  const tagStyles = [
    { bg: "rgba(46,204,113,.1)", color: "#6ee7b7", border: "rgba(46,204,113,.28)" },
    { bg: "rgba(148,163,184,.08)", color: "#94a3b8", border: "rgba(148,163,184,.2)" },
    { bg: "rgba(46,204,113,.06)", color: "#34d399", border: "rgba(46,204,113,.22)" },
  ];

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
      <div className="gc-accent gc-accent--mint" />

      {hovered && <div className="gc-shine" />}

      <div className="gc-header">
        <div className="gc-icon gc-icon--mint">
          <Users size={18} strokeWidth={1.75} />
        </div>
        <div className="gc-header-right">
          {meetupLabel && (
            <span className="gc-meetup-badge">
              <Calendar size={10} strokeWidth={1.75} />
              {meetupLabel} {nextMeetup?.time || ""}
            </span>
          )}
          <span className={`gc-visibility ${isPrivate ? "gc-visibility--private" : "gc-visibility--public"}`}>
            {isPrivate
              ? <><Lock size={10} strokeWidth={1.75} /> Private</>
              : <><Globe size={10} strokeWidth={1.75} /> Public</>
            }
          </span>
        </div>
      </div>

      <h3 className="gc-title" title={group.name}>{group.name}</h3>

      <div className="gc-meta">
        {group.courseCode && (
          <span className="gc-meta-pill">
            <BookOpen size={10} strokeWidth={1.75} /> {group.courseCode}
          </span>
        )}
        {group.subject && (
          <span className="gc-meta-pill">
            <Hash size={10} strokeWidth={1.75} /> {group.subject}
          </span>
        )}
        <span className="gc-meta-pill">
          <Users size={10} strokeWidth={1.75} /> {memberCount} member{memberCount !== 1 ? "s" : ""}
        </span>
      </div>

      {group.description && (
        <p className="gc-desc">{group.description}</p>
      )}

      {group.tags?.length > 0 && (
        <div className="gc-tags">
          {group.tags.slice(0, 4).map((tag, i) => {
            const tc = tagStyles[i % tagStyles.length];
            return (
              <span key={i} className="gc-tag"
                style={{ background: tc.bg, color: tc.color, borderColor: tc.border }}>
                <Tag size={9} strokeWidth={1.75} /> {tag}
              </span>
            );
          })}
          {group.tags.length > 4 && (
            <span className="gc-tag" style={{ background: "rgba(148,163,184,.1)", color: "var(--text-dim)", borderColor: "rgba(148,163,184,.2)" }}>
              +{group.tags.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="gc-footer">
        {isMember ? (
          <button
            type="button"
            className="gc-link-open"
            onClick={(e) => { e.stopPropagation(); onOpen(group._id); }}
          >
            Open section <ChevronRight size={14} strokeWidth={2} />
          </button>
        ) : isPrivate ? (
          <span className="gc-locked">
            <Lock size={12} strokeWidth={1.75} /> Invitation only
          </span>
        ) : (
          <button
            type="button"
            className="gc-btn gc-btn--join"
            disabled={joining[group._id]}
            onClick={(e) => { e.stopPropagation(); onJoin(group._id); }}
          >
            {joining[group._id]
              ? "Joining…"
              : <><UserPlus size={14} strokeWidth={1.75} /> Join Group</>
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
