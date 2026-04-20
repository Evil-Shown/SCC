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
        <div className="grp-invites-banner">
            <div className={`grp-invites-head ${shown.length === 0 ? "grp-invites-head--compact" : ""}`}>
                <div className="grp-invites-head__title">
                    <Mail size={16} className="grp-invites-head__icon" strokeWidth={1.75} />
                    <span>
                        You have {myInvites.length} pending group invite{myInvites.length !== 1 ? "s" : ""}
                    </span>
                </div>
                {myInvites.length > 2 && (
                    <button
                        type="button"
                        className="grp-invites-toggle"
                        onClick={() => setExpanded((e) => !e)}
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {expanded ? "Show less" : `Show all ${myInvites.length}`}
                    </button>
                )}
            </div>

            <div className="grp-invites-list">
                {shown.map((inv) => (
                    <div key={inv._id} className="grp-invites-row">
                        <div className="grp-invites-row__main">
                            <div className="grp-invites-row__name">
                                {inv.group?.name || "Unnamed group"}
                            </div>
                            <div className="grp-invites-row__meta">
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
