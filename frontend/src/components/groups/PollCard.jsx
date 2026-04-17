import { useState } from "react";
import { useDispatch } from "react-redux";
import { voteOnPoll, deleteExistingPoll, updateExistingPoll } from "../../features/polls/pollSlice";
import { Trash2, Lock, CheckCircle2, Circle } from "lucide-react";
import { confirmAction } from "../../utils/toast";

function PollCard({ poll, currentUser, isAdmin }) {
    const dispatch = useDispatch();
    const canManage = isAdmin || poll.creatorId?._id === currentUser?._id;

    const [selectedOptions, setSelectedOptions] = useState([]);

    const toggleOption = (id) => {
        if (!poll.isMultipleChoice) {
            setSelectedOptions([id]);
        } else {
            setSelectedOptions(prev => {
                if (prev.includes(id)) return prev.filter(x => x !== id);
                if (poll.maxVotesPerUser && prev.length >= poll.maxVotesPerUser) return prev;
                return [...prev, id];
            });
        }
    };

    const submitVote = () => {
        if (selectedOptions.length === 0) return;
        dispatch(voteOnPoll({ pollId: poll._id, optionIds: selectedOptions })).unwrap().then(() => {
            setSelectedOptions([]);
        });
    };

    const closePoll = async () => {
        const ok = await confirmAction("Close this poll? Members will no longer be able to vote.");
        if (ok) dispatch(updateExistingPoll({ pollId: poll._id, payload: { status: "Closed" } }));
    };

    const deletePoll = async () => {
        const ok = await confirmAction("Delete this poll? This cannot be undone.", { isDanger: true });
        if (ok) dispatch(deleteExistingPoll(poll._id));
    };

    const totalVotes = poll.totalVotes || 0;

    // See if the currently logged in student has already voted
    const userVotes = poll.options.filter(opt => opt.votes.some(v => v.user?._id === currentUser?._id || v.user === currentUser?._id)).map(opt => opt._id);
    const hasVoted = userVotes.length > 0;

    return (
        <div style={{
            background: "var(--color-bg-secondary)", borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)", padding: "1.5rem"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{
                            fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                            background: poll.status === "Live" ? "rgba(16, 185, 129, 0.15)" : poll.status === "Closed" ? "var(--color-border)" : "rgba(245, 158, 11, 0.15)",
                            color: poll.status === "Live" ? "#10b981" : poll.status === "Closed" ? "var(--color-text-secondary)" : "#f59e0b"
                        }}>
                            {poll.status}
                        </span>
                        {poll.isAnonymous && <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}><Lock size={10} /> Anonymous</span>}
                    </div>
                    <h4 style={{ margin: 0, fontSize: "16px", color: "var(--text)" }}>{poll.question}</h4>
                    {poll.message && <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "4px 0 0 0" }}>{poll.message}</p>}
                </div>
                {canManage && (
                    <div style={{ display: "flex", gap: 8 }}>
                        {poll.status === "Live" && (
                            <button className="btn btn-secondary btn-sm" onClick={closePoll}>Close</button>
                        )}
                        <button className="btn btn-sm" style={{ color: "var(--color-error)" }} onClick={deletePoll}><Trash2 size={14} /></button>
                    </div>
                )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                {poll.options.map(opt => {
                    const optVotes = opt.votes.length;
                    const percent = totalVotes === 0 ? 0 : Math.round((optVotes / totalVotes) * 100);
                    const isSelected = selectedOptions.includes(opt._id);
                    const isUserVotedForThis = userVotes.includes(opt._id);

                    return (
                        <div key={opt._id}
                            onClick={() => poll.status === "Live" ? toggleOption(opt._id) : null}
                            style={{
                                position: "relative", padding: "10px 14px", borderRadius: "var(--radius-md)",
                                border: `1px solid ${isSelected || isUserVotedForThis ? "var(--color-primary-500)" : "var(--color-border)"}`,
                                background: isSelected || isUserVotedForThis ? "rgba(99, 102, 241, 0.05)" : "transparent",
                                cursor: poll.status === "Live" ? "pointer" : "default",
                                overflow: "hidden", display: "flex", justifyContent: "space-between", alignItems: "center"
                            }}>
                            <div style={{
                                position: "absolute", left: 0, top: 0, bottom: 0,
                                width: `${percent}%`, background: "rgba(99, 102, 241, 0.1)", zIndex: 0, transition: "width 0.3s ease"
                            }} />
                            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8, fontSize: "14px" }}>
                                {poll.status === "Live" && (
                                    isSelected || isUserVotedForThis ? <CheckCircle2 size={16} color="var(--color-primary-500)" /> : <Circle size={16} color="var(--color-text-secondary)" />
                                )}
                                <span style={{ fontWeight: isSelected || isUserVotedForThis ? 600 : 400 }}>{opt.text}</span>
                            </div>
                            <div style={{ position: "relative", zIndex: 1, fontSize: "13px", fontWeight: 600, color: "var(--text-dim)" }}>
                                {(hasVoted || poll.status === "Closed" || canManage) ? `${percent}% (${optVotes})` : ""}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                    {totalVotes} vote{totalVotes !== 1 && "s"} total
                </span>
                {poll.status === "Live" && selectedOptions.length > 0 && !hasVoted && (
                    <button className="btn btn-primary btn-sm" onClick={submitVote}>Submit Vote</button>
                )}
                {poll.status === "Live" && selectedOptions.length > 0 && hasVoted && (
                    <button className="btn btn-primary btn-sm" onClick={submitVote}>Change Vote</button>
                )}
            </div>
        </div>
    );
}

export default PollCard;
