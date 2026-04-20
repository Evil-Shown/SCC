import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchGroupPolls, createPoll, deleteExistingPoll, updateExistingPoll, voteOnPoll } from "../../features/polls/pollSlice";
import PollCard from "./PollCard";
import CreatePollModal from "./CreatePollModal";
import { Plus, BarChart2 } from "lucide-react";
import LoadingSpinner from "../LoadingSpinner";

// This tab shows all the polls in the group
function PollsTab({ groupId, isAdmin, currentUser }) {
    const dispatch = useDispatch();
    const { byGroupId } = useSelector((s) => s.polls); // Get polls from our redux store
    const groupPolls = byGroupId[groupId] || { items: [], loading: false };

    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        dispatch(fetchGroupPolls(groupId));
    }, [dispatch, groupId]);

    const activePolls = groupPolls.items.filter(p => p.status === "Live");
    const closedPolls = groupPolls.items.filter(p => p.status === "Closed");
    const draftPolls = groupPolls.items.filter(p => p.status === "Draft");

    return (
        <div className="meetups-tab-container fade-in">
            {/* Header matches meetups style */}
            <div className="mt-header">
                <div>
                    <h3 className="mt-title">Smart Polls</h3>
                    <p className="mt-sub">Gather feedback from your group members in real-time · {groupPolls.items.length} polls total</p>
                </div>
                <button type="button" className="grp-btn-primary grp-btn-sm" onClick={() => setShowCreate(true)}>
                    <Plus size={16} /> Create Poll
                </button>
            </div>

            {groupPolls.loading && groupPolls.items.length === 0 ? (
                <LoadingSpinner text="Loading polls…" />
            ) : groupPolls.items.length === 0 ? (
                <div className="ft-empty">
                    <div className="ft-empty-icon"><BarChart2 size={48} strokeWidth={1} /></div>
                    <h4 className="ft-empty-title">No polls active</h4>
                    <p className="ft-empty-sub">Create the first poll to engage group members.</p>
                    <button type="button" className="grp-btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={16} /> Create First Poll
                    </button>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {activePolls.length > 0 && (
                        <div>
                            <div className="mt-section-label">Live Polls</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {activePolls.map(p => <PollCard key={p._id} poll={p} currentUser={currentUser} isAdmin={isAdmin} />)}
                            </div>
                        </div>
                    )}
                    {draftPolls.length > 0 && (
                        <div>
                            <div className="mt-section-label">Drafts</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {draftPolls.map(p => <PollCard key={p._id} poll={p} currentUser={currentUser} isAdmin={isAdmin} />)}
                            </div>
                        </div>
                    )}
                    {closedPolls.length > 0 && (
                        <div>
                            <div className="mt-section-label">Closed Polls</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12, opacity: 0.8 }}>
                                {closedPolls.map(p => <PollCard key={p._id} poll={p} currentUser={currentUser} isAdmin={isAdmin} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showCreate && <CreatePollModal groupId={groupId} onClose={() => setShowCreate(false)} />}
        </div>
    );
}

export default PollsTab;
