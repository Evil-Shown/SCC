import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchGroupActivity,
    selectGroupActivity,
    selectActivityLoading,
} from "../../features/groups/groupSlice";
import {
    UserPlus, UserMinus, Shield, Crown, LogOut, Settings,
    Trash2, Send, CheckCircle, XCircle, RotateCcw, Activity,
    ChevronDown,
} from "lucide-react";

/* ── Action icon + label map ────────────────────────────── */
const ACTION_META = {
    group_created: { Icon: CheckCircle, color: "#34d399", label: "created the group" },
    group_updated: { Icon: Settings, color: "#a5b4fc", label: "updated group settings" },
    group_deleted: { Icon: Trash2, color: "#f87171", label: "deleted the group" },
    member_joined: { Icon: UserPlus, color: "#34d399", label: "joined the group" },
    member_left: { Icon: LogOut, color: "#94a3b8", label: "left the group" },
    member_invited: { Icon: Send, color: "#818cf8", label: "added a member" },
    member_removed: { Icon: UserMinus, color: "#f87171", label: "removed a member" },
    invite_sent: { Icon: Send, color: "#818cf8", label: "sent an invite to" },
    invite_accepted: { Icon: CheckCircle, color: "#34d399", label: "accepted invite and joined" },
    invite_declined: { Icon: XCircle, color: "#f87171", label: "declined the invite" },
    invite_revoked: { Icon: RotateCcw, color: "#94a3b8", label: "revoked an invite" },
    role_promoted: { Icon: Shield, color: "#818cf8", label: "promoted" },
    role_demoted: { Icon: Shield, color: "#94a3b8", label: "demoted" },
    ownership_transferred: { Icon: Crown, color: "#fbbf24", label: "transferred ownership to" },
};

/* ── Avatar ─────────────────────────────────────────────── */
function Avatar({ name = "?", size = 30 }) {
    const colors = [
        "linear-gradient(135deg,#6366f1,#8b5cf6)",
        "linear-gradient(135deg,#06b6d4,#3b82f6)",
        "linear-gradient(135deg,#10b981,#06b6d4)",
        "linear-gradient(135deg,#f59e0b,#ef4444)",
    ];
    const idx = (name.charCodeAt(0) || 0) % colors.length;
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: colors[idx], display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: size * 0.38,
            flexShrink: 0,
        }}>
            {name[0]?.toUpperCase() || "?"}
        </div>
    );
}

/* ── Skeleton row ───────────────────────────────────────── */
function SkeletonRow() {
    return (
        <div style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "12px 0", borderBottom: "1px solid var(--color-border)",
        }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                <div style={{ width: "55%", height: 11, borderRadius: 6, background: "rgba(255,255,255,0.08)" }} />
                <div style={{ width: "30%", height: 9, borderRadius: 6, background: "rgba(255,255,255,0.05)" }} />
            </div>
        </div>
    );
}

/* ── Time ago helper ─────────────────────────────────────── */
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}

/* ── Single activity row ─────────────────────────────────── */
function ActivityRow({ item }) {
    const meta = ACTION_META[item.action] || { Icon: Activity, color: "#94a3b8", label: item.action };
    const { Icon, color, label } = meta;

    const actorName = item.actor?.name || "Someone";
    const targetName = item.target?.name;

    return (
        <div style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
            {/* Icon dot */}
            <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: `${color}1a`, display: "flex",
                alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 0 2px ${color}30`,
            }}>
                <Icon size={14} style={{ color }} />
            </div>

            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700 }}>{actorName}</span>{" "}
                    <span style={{ color: "var(--text-dim)" }}>{label}</span>
                    {targetName && (
                        <>{" "}<span style={{ fontWeight: 600, color: "var(--text)" }}>{targetName}</span></>
                    )}
                    {item.meta?.newName && item.meta?.prevName && (
                        <span style={{ color: "var(--text-dim)" }}>
                            {" "}(renamed from{" "}
                            <em>{item.meta.prevName}</em>)
                        </span>
                    )}
                    {item.meta?.newRole && (
                        <span style={{ color }} > → {item.meta.newRole}</span>
                    )}
                </p>
                <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                    {timeAgo(item.createdAt)}
                </span>
            </div>
        </div>
    );
}

/* ── Main component ─────────────────────────────────────── */
export default function ActivityTab({ groupId }) {
    const dispatch = useDispatch();
    const activityState = useSelector(selectGroupActivity(groupId));
    const loading = useSelector(selectActivityLoading);
    const [page, setPage] = useState(1);
    const LIMIT = 20;

    useEffect(() => {
        dispatch(fetchGroupActivity({ groupId, page: 1, limit: LIMIT }));
        setPage(1);
    }, [dispatch, groupId]);

    const handleLoadMore = () => {
        const next = page + 1;
        setPage(next);
        dispatch(fetchGroupActivity({ groupId, page: next, limit: LIMIT }));
    };

    const items = activityState?.items || [];
    const total = activityState?.total || 0;
    const hasMore = items.length < total;

    return (
        <div style={{ padding: "4px 0" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Activity size={16} style={{ color: "var(--color-primary-500)" }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                    Activity Log
                </span>
                <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 7px",
                    borderRadius: 10, background: "rgba(99,102,241,.15)", color: "#a5b4fc",
                }}>
                    {total} events
                </span>
            </div>

            {/* Skeleton */}
            {loading && items.length === 0 && (
                <div>{[1, 2, 3, 4, 5].map((k) => <SkeletonRow key={k} />)}</div>
            )}

            {/* Empty */}
            {!loading && items.length === 0 && (
                <div style={{
                    textAlign: "center", padding: "40px 16px",
                    background: "rgba(255,255,255,0.03)", borderRadius: 12,
                    border: "1px dashed var(--color-border)",
                }}>
                    <Activity size={40} strokeWidth={1} style={{ color: "var(--text-dim)", marginBottom: 8 }} />
                    <p style={{ color: "var(--text-dim)", fontSize: 13, margin: 0 }}>
                        No activity recorded yet
                    </p>
                </div>
            )}

            {/* Activity list */}
            {items.length > 0 && (
                <div>
                    {items.map((item) => (
                        <ActivityRow key={item._id} item={item} />
                    ))}

                    {hasMore && (
                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ width: "100%", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                            onClick={handleLoadMore}
                            disabled={loading}
                        >
                            <ChevronDown size={14} />
                            {loading ? "Loading…" : `Load more (${total - items.length} remaining)`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
