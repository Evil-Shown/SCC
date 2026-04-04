import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchGroupInvites,
    sendInviteAction,
    revokeInviteAction,
    selectGroupInvites,
} from "../../features/groups/groupSlice";
import * as groupService from "../../services/groupService";
import { notifySuccess, notifyError } from "../../utils/toast.jsx";
import { UserPlus, Mail, Search, Send, Trash2, Clock, User } from "lucide-react";

/* ── Avatar helper ─────────────────────────────────────── */
function Avatar({ name = "?", size = 34 }) {
    const colors = [
        "linear-gradient(135deg,#6366f1,#8b5cf6)",
        "linear-gradient(135deg,#06b6d4,#3b82f6)",
        "linear-gradient(135deg,#a855f7,#ec4899)",
        "linear-gradient(135deg,#10b981,#06b6d4)",
        "linear-gradient(135deg,#f59e0b,#ef4444)",
    ];
    const idx = (name.charCodeAt(0) || 0) % colors.length;
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: colors[idx], display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
        }}>
            {name[0]?.toUpperCase() || "?"}
        </div>
    );
}

/* ── Skeleton row ──────────────────────────────────────── */
function SkeletonRow() {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            animation: "pulse 1.8s ease-in-out infinite",
        }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ width: "40%", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.08)" }} />
                <div style={{ width: "60%", height: 10, borderRadius: 6, background: "rgba(255,255,255,0.05)" }} />
            </div>
        </div>
    );
}

/* ── Status badge ──────────────────────────────────────── */
const statusStyles = {
    pending: { bg: "rgba(245,158,11,.12)", border: "rgba(245,158,11,.3)", color: "#fbbf24" },
    accepted: { bg: "rgba(52,211,153,.12)", border: "rgba(52,211,153,.3)", color: "#34d399" },
    declined: { bg: "rgba(239,68,68,.12)", border: "rgba(239,68,68,.3)", color: "#f87171" },
    expired: { bg: "rgba(148,163,184,.1)", border: "rgba(148,163,184,.2)", color: "#94a3b8" },
    revoked: { bg: "rgba(148,163,184,.1)", border: "rgba(148,163,184,.2)", color: "#94a3b8" },
};

function StatusBadge({ status }) {
    const s = statusStyles[status] || statusStyles.expired;
    return (
        <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 8px",
            borderRadius: 4, background: s.bg,
            border: `1px solid ${s.border}`, color: s.color, textTransform: "uppercase",
        }}>
            {status}
        </span>
    );
}

/* ── Main component ────────────────────────────────────── */
export default function InvitesTab({ groupId, isAdmin, currentUser }) {
    const dispatch = useDispatch();
    const invites = useSelector(selectGroupInvites(groupId));
    const { invitesLoading } = useSelector((s) => s.groups);

    // Invite-by-search state
    const [searchQ, setSearchQ] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [sending, setSending] = useState({});
    const searchTimer = useRef(null);

    // Email fallback
    const [emailInput, setEmailInput] = useState("");
    const [emailSending, setEmailSending] = useState(false);

    // Revoking
    const [revoking, setRevoking] = useState({});

    useEffect(() => {
        if (isAdmin) dispatch(fetchGroupInvites(groupId));
    }, [dispatch, groupId, isAdmin]);

    const handleSearch = (e) => {
        const q = e.target.value;
        setSearchQ(q);
        clearTimeout(searchTimer.current);
        if (q.length < 2) { setSearchResults([]); return; }
        setSearching(true);
        searchTimer.current = setTimeout(async () => {
            try {
                const res = await groupService.searchUsers(q, groupId);
                setSearchResults(res.data || []);
            } catch { setSearchResults([]); }
            finally { setSearching(false); }
        }, 350);
    };

    const handleSendByUser = async (userId) => {
        setSending((p) => ({ ...p, [userId]: true }));
        try {
            await dispatch(sendInviteAction({ groupId, payload: { userId } })).unwrap();
            setSearchResults((prev) => prev.filter((u) => u._id !== userId));
            setSearchQ("");
            notifySuccess("Invite sent!");
        } catch (e) { notifyError(e); }
        finally { setSending((p) => ({ ...p, [userId]: false })); }
    };

    const handleSendByEmail = async (e) => {
        e.preventDefault();
        if (!emailInput.trim()) return;
        setEmailSending(true);
        try {
            await dispatch(sendInviteAction({ groupId, payload: { email: emailInput.trim() } })).unwrap();
            setEmailInput("");
            notifySuccess("Invite sent!");
        } catch (e) { notifyError(e); }
        finally { setEmailSending(false); }
    };

    const handleRevoke = async (inviteId) => {
        setRevoking((p) => ({ ...p, [inviteId]: true }));
        try {
            await dispatch(revokeInviteAction({ groupId, inviteId })).unwrap();
            notifySuccess("Invite revoked");
        } catch (e) { notifyError(e); }
        finally { setRevoking((p) => ({ ...p, [inviteId]: false })); }
    };

    if (!isAdmin) {
        return (
            <div className="ft-empty" style={{ marginTop: 40 }}>
                <div className="ft-empty-icon"><UserPlus size={48} strokeWidth={1} /></div>
                <h4 className="ft-empty-title">Admins only</h4>
                <p className="ft-empty-sub">Only group admins and the owner can manage invites.</p>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "4px 0" }}>
            {/* ── Send invite panel ── */}
            <div style={{
                background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.18)",
                borderRadius: 14, padding: "18px 20px",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <UserPlus size={18} style={{ color: "var(--color-primary-500)" }} />
                    <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                            Send Invite
                        </h4>
                        <p style={{ margin: 0, fontSize: 12, color: "var(--text-dim)" }}>
                            Search by name/email or enter an email address
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div style={{ position: "relative", marginBottom: 12 }}>
                    <Search size={14} style={{
                        position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                        color: "var(--text-dim)", pointerEvents: "none",
                    }} />
                    <input
                        className="form-input"
                        value={searchQ}
                        onChange={handleSearch}
                        placeholder="Search users by name or email…"
                        style={{ paddingLeft: 36 }}
                    />
                </div>

                {/* Search results */}
                {searching && (
                    <p style={{ fontSize: 12, color: "var(--text-dim)", margin: "0 0 8px" }}>Searching…</p>
                )}
                {searchResults.length > 0 && (
                    <div style={{
                        background: "var(--color-bg-primary)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 10, overflow: "hidden", marginBottom: 12,
                    }}>
                        {searchResults.map((u) => (
                            <div key={u._id} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "10px 14px",
                                borderBottom: "1px solid var(--color-border)",
                            }}>
                                <Avatar name={u.name} size={34} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{u.email}</div>
                                </div>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleSendByUser(u._id)}
                                    disabled={sending[u._id]}
                                >
                                    {sending[u._id] ? "Sending…" : <><Send size={12} /> Invite</>}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Email fallback */}
                <form onSubmit={handleSendByEmail} style={{ display: "flex", gap: 8 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <Mail size={14} style={{
                            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                            color: "var(--text-dim)", pointerEvents: "none",
                        }} />
                        <input
                            className="form-input"
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="Or enter email directly…"
                            style={{ paddingLeft: 36 }}
                        />
                    </div>
                    <button type="submit" className="btn btn-secondary btn-sm" disabled={emailSending || !emailInput.trim()}>
                        {emailSending ? "…" : <><Send size={13} /> Send</>}
                    </button>
                </form>
            </div>

            {/* ── Pending invites list ── */}
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Clock size={15} style={{ color: "var(--color-primary-500)" }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                        Pending Invites
                    </span>
                    <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 7px",
                        borderRadius: 10, background: "rgba(99,102,241,.15)", color: "#a5b4fc",
                    }}>
                        {invites.length}
                    </span>
                </div>

                {invitesLoading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[1, 2, 3].map((k) => <SkeletonRow key={k} />)}
                    </div>
                ) : invites.length === 0 ? (
                    <div style={{
                        textAlign: "center", padding: "32px 16px",
                        background: "rgba(255,255,255,0.03)", borderRadius: 12,
                        border: "1px dashed var(--color-border)",
                    }}>
                        <User size={36} strokeWidth={1} style={{ color: "var(--text-dim)", marginBottom: 8 }} />
                        <p style={{ color: "var(--text-dim)", fontSize: 13, margin: 0 }}>
                            No pending invites
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {invites.map((inv) => (
                            <div key={inv._id} style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "12px 16px", borderRadius: 10,
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid var(--color-border)",
                                transition: "background .2s",
                            }}>
                                <Avatar name={inv.invitee?.name || "?"} size={36} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                                        {inv.invitee?.name || "Unknown"}
                                    </div>
                                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                                        {inv.invitee?.email} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <StatusBadge status={inv.status} />
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleRevoke(inv._id)}
                                    disabled={revoking[inv._id]}
                                    title="Revoke invite"
                                >
                                    {revoking[inv._id] ? "…" : <Trash2 size={13} />}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
