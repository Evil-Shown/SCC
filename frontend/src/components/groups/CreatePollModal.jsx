import { useState } from "react";
import { useDispatch } from "react-redux";
import { createPoll } from "../../features/polls/pollSlice";
import { X, BarChart2, Plus, Trash2 } from "lucide-react";
import "../../styles/Dashboard.css";

// Popup to create a new poll in the group
function CreatePollModal({ groupId, onClose }) {
    const dispatch = useDispatch();
    const [form, setForm] = useState({
        question: "", // What are we asking?
        message: "",
        options: [{ text: "" }, { text: "" }], // Start with 2 empty options
        isMultipleChoice: false,
        isAnonymous: false,
        maxVotesPerUser: 1,
        status: "Live"
    });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleOptionChange = (idx, val) => {
        const newOps = [...form.options];
        newOps[idx].text = val;
        setField("options", newOps);
    };

    const addOption = () => {
        setField("options", [...form.options, { text: "" }]);
    };

    const removeOption = (idx) => {
        if (form.options.length <= 2) return;
        const newOps = form.options.filter((_, i) => i !== idx);
        setField("options", newOps);
    };

    const submit = async (e) => {
        e.preventDefault();

        if (!form.question.trim()) return setErr("Question is required.");
        const validOptions = form.options.filter(o => o.text.trim());
        if (validOptions.length < 2) return setErr("Please provide at least 2 options.");

        const unique = new Set(validOptions.map(o => o.text.trim()));
        if (unique.size !== validOptions.length) return setErr("Duplicate options are not allowed.");

        setBusy(true); setErr("");
        try {
            await dispatch(createPoll({ groupId, payload: { ...form, options: validOptions } })).unwrap();
            onClose();
        } catch (e) {
            setErr(typeof e === "string" ? e : "Failed to create poll");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content scale-in" style={{ maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="modal-icon-box">
                            <BarChart2 size={18} strokeWidth={1.75} />
                        </span>
                        Create Poll
                    </h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <form id="poll-form" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>

                        <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label">Question / Title *</label>
                            <input className="form-input" value={form.question} onChange={e => setField("question", e.target.value)} placeholder="What should we discuss next?" required />
                        </div>

                        <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label">
                                Description <span className="form-label__opt">(optional)</span>
                            </label>
                            <textarea className="form-textarea" value={form.message} onChange={e => setField("message", e.target.value)} placeholder="Add some context..." rows={2} style={{ resize: "vertical" }} />
                        </div>

                        <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                                Answer Options *
                            </label>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {form.options.map((opt, i) => (
                                    <div key={i} style={{ display: "flex", gap: 8 }}>
                                        <input className="form-input" value={opt.text} onChange={e => handleOptionChange(i, e.target.value)} placeholder={`Option ${i + 1}`} required />
                                        {form.options.length > 2 && (
                                            <button type="button" className="grp-btn-secondary grp-btn-sm" style={{ padding: "0 12px" }} onClick={() => removeOption(i)}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button type="button" className="grp-btn-secondary grp-btn-sm" style={{ marginTop: 8 }} onClick={addOption}>
                                <Plus size={14} /> Add Option
                            </button>
                        </div>

                        <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label">Settings</label>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--color-bg-secondary)", padding: 12, borderRadius: "var(--radius-md)" }}>
                                <label className="form-control-label">
                                    <input type="checkbox" checked={form.isMultipleChoice} onChange={e => setField("isMultipleChoice", e.target.checked)} />
                                    Allow multiple answers
                                </label>
                                {form.isMultipleChoice && (
                                    <div style={{ paddingLeft: 24 }}>
                                        <label className="form-aux-label">Max votes per user (0 for unlimited):</label>
                                        <input type="number" className="form-input" style={{ padding: "4px 8px", minHeight: "auto", width: 80, marginLeft: 8 }} value={form.maxVotesPerUser} onChange={e => setField("maxVotesPerUser", parseInt(e.target.value) || 0)} min={0} />
                                    </div>
                                )}
                                <label className="form-control-label">
                                    <input type="checkbox" checked={form.isAnonymous} onChange={e => setField("isAnonymous", e.target.checked)} />
                                    Anonymous voting
                                </label>
                            </div>
                        </div>

                        <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label">Publishing</label>
                            <select className="form-input" value={form.status} onChange={e => setField("status", e.target.value)}>
                                <option value="Live">Publish immediately (Live)</option>
                                <option value="Draft">Save as Draft</option>
                            </select>
                        </div>

                        {err && <p style={{ color: "var(--color-error)", fontSize: "var(--font-size-sm)", margin: 0 }}>{err}</p>}
                    </form>
                </div>

                <div className="modal-actions">
                    <button type="button" className="grp-btn-secondary" onClick={onClose}>Cancel</button>
                    <button type="submit" form="poll-form" className="grp-btn-primary" disabled={busy}>
                        {busy ? "Saving…" : "Save Poll"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreatePollModal;
