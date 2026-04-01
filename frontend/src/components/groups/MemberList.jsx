import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchGroupById } from "../../features/groups/groupSlice";
import * as groupService from "../../services/groupService";
import { Search, UserPlus, Crown, Shield, Trash2, User } from "lucide-react";

// ── Avatar with gradient bg ────────────────────────────────────
function Avatar({ name = "?", size = 40 }) {
    const gradients = [
        "linear-gradient(135deg,#6366f1,#8b5cf6)",
        "linear-gradient(135deg,#06b6d4,#3b82f6)",
        "linear-gradient(135deg,#a855f7,#ec4899)",
        "linear-gradient(135deg,#10b981,#06b6d4)",
        "linear-gradient(135deg,#f59e0b,#ef4444)",
    ];
    const idx = (name.charCodeAt(0) || 0) % gradients.length;
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: gradients[idx],
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700,
            fontSize: size * 0.38,
            flexShrink: 0,
        }}>
            {name[0]?.toUpperCase() || "?"}
        </div>
    );
}

// ── MemberList ─────────────────────────────────────────────────
function MemberList({ group, currentUser, groupId, isAdmin }) {
    const dispatch = useDispatch();

    const [removing, setRemoving] = useState({});
    const [inviteSearch, setInviteSearch] = useState("");
    const [inviteResults, setInviteResults] = useState([]);
    const [inviteSearching, setInviteSearching] = useState(false);
    const [inviting, setInviting] = useState({});
    const searchTimer = useRef(null);

    const memberCount = group?.members?.length || 0;

    // ── Invite search (debounced) ──────────────────────────────
    const handleSearchChange = (e) => {
        const q = e.target.value;
        setInviteSearch(q);
        clearTimeout(searchTimer.current);
        if (q.length < 2) { setInviteResults([]); return; }
        setInviteSearching(true);
        searchTimer.current = setTimeout(async () => {
            try {
                const res = await groupService.searchUsers(q, groupId);
                setInviteResults(res.data || []);
            } catch { setInviteResults([]); }
            finally { setInviteSearching(false); }
        }, 350);
    };

    const handleInvite = async (userId) => {
        setInviting((p) => ({ ...p, [userId]: true }));
        try {
            await groupService.inviteMember(groupId, userId);
            setInviteResults((prev) => prev.filter((u) => u._id !== userId));
            dispatch(fetchGroupById(groupId));
        } catch (e) { console.error(e); }
        finally { setInviting((p) => ({ ...p, [userId]: false })); }
    };

    const handleRemove = async (memberId, memberName) => {
        if (!window.confirm(`Remove ${memberName} from the group?`)) return;
        setRemoving((p) => ({ ...p, [memberId]: true }));
        try {
            await groupService.removeMember(groupId, memberId);
            dispatch(fetchGroupById(groupId));
        } catch (e) { console.error(e); }
        finally { setRemoving((p) => ({ ...p, [memberId]: false })); }
    };

    return (
        <div className="ml-root">
            {/* ── Invite panel (admins only) ── */}
            {isAdmin && (
                <div className="ml-invite-panel">
                    <div className="ml-invite-header">
                        <UserPlus size={18} style={{ color: "var(--color-primary-500)" }} />
                        <div>
                            <h4 className="ml-invite-title">Add Members</h4>
                            <p className="ml-invite-sub">Search students by name or email</p>
                        </div>
                    </div>

                    <div className="ml-search-wrap">
                        <Search size={15} className="ml-search-icon" />
                        <input
                            className="form-input ml-search-input"
                            value={inviteSearch}
                            onChange={handleSearchChange}
                            placeholder="Search by name or email…"
                        />
                    </div>

                    {inviteSearching && (
                        <p className="ml-searching">Searching…</p>
                    )}

                    {inviteResults.length > 0 && (
                        <div className="ml-results">
                            {inviteResults.map((u) => (
                                <div key={u._id} className="ml-result-row">
                                    <Avatar name={u.name} size={34} />
                                    <div className="ml-result-info">
                                        <span className="ml-result-name">{u.name}</span>
                                        <span className="ml-result-email">{u.email}</span>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleInvite(u._id)}
                                        disabled={inviting[u._id]}
                                    >
                                        {inviting[u._id] ? "Adding…" : <><UserPlus size={13} /> Add</>}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Section title ── */}
            <div className="ml-section-head">
                <User size={16} style={{ color: "var(--color-primary-500)" }} />
                <span className="ml-section-title">Members</span>
                <span className="ml-count-badge">{memberCount}</span>
            </div>

            {/* ── Member list ── */}
            <div className="ml-list">
                {group?.members?.map((m, idx) => {
                    const member = m.user || m;
                    const memberId = (member?._id || member)?.toString();
                    const isCreator =
                        group.creator === memberId ||
                        group.creator?._id?.toString() === memberId;
                    const isAdminMember =
                        m.role === "admin" ||
                        group.admins?.some((a) => (a._id || a)?.toString() === memberId);
                    const isYou = memberId === currentUser?._id;

                    return (
                        <div key={memberId || idx} className="ml-member-row">
                            <Avatar name={member?.name || "M"} size={40} />

                            <div className="ml-member-info">
                                <span className="ml-member-name">
                                    {member?.name || "Member"}
                                    {isYou && <span className="ml-you-badge">(You)</span>}
                                </span>
                                <span className="ml-member-email">{member?.email || ""}</span>
                            </div>

                            <div className="ml-member-badges">
                                {isCreator && (
                                    <span className="ml-role-badge ml-role-badge--creator">
                                        <Crown size={11} /> Creator
                                    </span>
                                )}
                                {!isCreator && isAdminMember && (
                                    <span className="ml-role-badge ml-role-badge--admin">
                                        <Shield size={11} /> Admin
                                    </span>
                                )}
                                {!isCreator && (
                                    <span className="ml-role-badge ml-role-badge--member">Member</span>
                                )}

                                {isAdmin && !isCreator && !isYou && (
                                    <button
                                        className="btn btn-danger btn-sm ml-remove-btn"
                                        onClick={() => handleRemove(memberId, member?.name)}
                                        disabled={removing[memberId]}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export { Avatar };
export default MemberList;
