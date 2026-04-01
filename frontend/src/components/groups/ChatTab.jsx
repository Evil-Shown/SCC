import { useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMessages, sendMessage } from "../../features/chat/chatSlice";
import { Send } from "lucide-react";
import { useState } from "react";
import LoadingSpinner from "../LoadingSpinner";

// ── Avatar for chat ─────────────────────────────────────────────
function ChatAvatar({ name = "?" }) {
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
            width: 34, height: 34, borderRadius: "50%",
            background: gradients[idx],
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 13,
            flexShrink: 0, userSelect: "none",
        }}>
            {name[0]?.toUpperCase() || "?"}
        </div>
    );
}

// ── Format time ─────────────────────────────────────────────────
function fmtTime(ts) {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── ChatTab ─────────────────────────────────────────────────────
function ChatTab({ groupId }) {
    const dispatch = useDispatch();
    const { messages: messagesMap, isLoading } = useSelector((s) => s.chat);
    const { user } = useSelector((s) => s.auth);
    const messages = messagesMap[groupId] || [];

    const [input, setInput] = useState("");
    const endRef = useRef(null);

    useEffect(() => {
        dispatch(fetchMessages({ groupId }));
    }, [dispatch, groupId]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        dispatch(sendMessage({ groupId, content: input.trim() }));
        setInput("");
    };

    // Group consecutive messages from same sender
    const grouped = messages.reduce((acc, msg, i) => {
        const prevMsg = messages[i - 1];
        const senderId = msg.sender?._id || msg.sender;
        const prevSenderId = prevMsg?.sender?._id || prevMsg?.sender;
        const isFirst = senderId !== prevSenderId;
        acc.push({ ...msg, isFirst });
        return acc;
    }, []);

    return (
        <div className="ct-root">
            {/* Messages area */}
            <div className="ct-messages">
                {isLoading && messages.length === 0 && (
                    <div className="ct-loading">
                        <LoadingSpinner text="Loading messages…" />
                    </div>
                )}

                {!isLoading && messages.length === 0 && (
                    <div className="ct-empty">
                        <div className="ct-empty-icon">💬</div>
                        <p className="ct-empty-title">No messages yet</p>
                        <p className="ct-empty-sub">Be the first to send a message to the group!</p>
                    </div>
                )}

                {grouped.map((msg) => {
                    const isOwn = (msg.sender?._id || msg.sender) === user?._id;
                    const senderName = msg.sender?.name || "Member";

                    return (
                        <div
                            key={msg._id}
                            className={`ct-msg-row ${isOwn ? "ct-msg-row--own" : ""} ${msg.isFirst ? "ct-msg-row--first" : ""}`}
                        >
                            {/* Avatar (other users only, first in group) */}
                            {!isOwn && msg.isFirst && (
                                <div className="ct-avatar-slot">
                                    <ChatAvatar name={senderName} />
                                </div>
                            )}
                            {!isOwn && !msg.isFirst && <div className="ct-avatar-spacer" />}

                            <div className={`ct-bubble-wrap ${isOwn ? "ct-bubble-wrap--own" : ""}`}>
                                {/* Sender name (other, first only) */}
                                {!isOwn && msg.isFirst && (
                                    <span className="ct-sender-name">{senderName}</span>
                                )}

                                <div className={`ct-bubble ${isOwn ? "ct-bubble--own" : "ct-bubble--other"}`}>
                                    {msg.content}
                                </div>

                                <span className={`ct-time ${isOwn ? "ct-time--own" : ""}`}>
                                    {fmtTime(msg.createdAt)}
                                </span>
                            </div>
                        </div>
                    );
                })}

                <div ref={endRef} />
            </div>

            {/* Input bar */}
            <form className="ct-input-bar" onSubmit={handleSend}>
                <input
                    className="ct-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message…"
                    autoComplete="off"
                />
                <button
                    type="submit"
                    className="ct-send-btn btn btn-primary"
                    disabled={!input.trim()}
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}

export default ChatTab;
