import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    fetchMyInvites, acceptInviteAction, declineInviteAction,
    selectMyInvites,
} from "../../features/groups/groupSlice";
import { notifySuccess, notifyError } from "../../utils/toast";
import { Mail, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function MyInvitesBanner() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const myInvites = useSelector(selectMyInvites);
    const { invitesLoading } = useSelector((s) => s.groups);
    const [expanded, setExpanded] = useState(false);
    const [busy, setBusy] = useState({});

    useEffect(() => {
        dispatch(fetchMyInvites());
    }, [dispatch]);

    if (myInvites.length === 0) return null;

    const handleAccept = async (inviteId, groupId) => {
        setBusy((p) => ({ ...p, [inviteId]: "accept" }));
        try {
            await dispatch(acceptInviteAction(inviteId)).unwrap();
            notifySuccess("You joined the group!");
            if (groupId) navigate(`/groups/${groupId}`);
        } catch (e) { notifyError(typeof e === "string" ? e : "Failed to accept"); }
        finally { setBusy((p) => ({ ...p, [inviteId]: null })); }
    };

    const handleDecline = async (inviteId) => {
        setBusy((p) => ({ ...p, [inviteId]: "decline" }));
        try {
            await dispatch(declineInviteAction(inviteId)).unwrap();
            notifySuccess("Invite declined");
        } catch (e) { notifyError(typeof e === "string" ? e : "Failed to decline"); }
        finally { setBusy((p) => ({ ...p, [inviteId]: null })); }
    };

    const shown = expanded ? myInvites : myInvites.slice(0, 2);

    return (
        <div style={{
            margin: "0 0 16px",
            background: "rgba(99,102,241,.08)",
            border: "1px solid rgba(99,102,241,.25)",
            borderRadius: 14,
            padding: "14px 18px",
        }}>
            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: shown.length > 0 ? 12 : 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Mail size={16} style={{ color: "#818cf8" }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                        You have {myInvites.length} pending group invite{myInvites.length !== 1 ? "s" : ""}
                    </span>
                </div>
                {myInvites.length > 2 && (
                    <button
                        onClick={() => setExpanded((e) => !e)}
                        style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#a5b4fc", display: "flex", alignItems: "center", gap: 4,
                            fontSize: 12, fontWeight: 600,
                        }}
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {expanded ? "Show less" : `Show all ${myInvites.length}`}
                    </button>
                )}
            </div>

            {/* Invite rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {shown.map((inv) => (
                    <div key={inv._id} style={{
                        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                        background: "rgba(255,255,255,0.04)", borderRadius: 10,
                        padding: "10px 14px", border: "1px solid rgba(99,102,241,.15)",
                    }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                                {inv.group?.name || "Unnamed group"}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                                Invited by {inv.invitedBy?.name} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleAccept(inv._id, inv.group?._id)}
                                disabled={!!busy[inv._id]}
                                style={{ display: "flex", alignItems: "center", gap: 5 }}
                            >
                                <CheckCircle size={13} />
                                {busy[inv._id] === "accept" ? "Joining…" : "Accept"}
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleDecline(inv._id)}
                                disabled={!!busy[inv._id]}
                                style={{ display: "flex", alignItems: "center", gap: 5 }}
                            >
                                <XCircle size={13} />
                                {busy[inv._id] === "decline" ? "…" : "Decline"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
