import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { getAiModels, sendAiMessage } from "../services/aiService";
import "../styles/AiChat.css";
import LoadingSpinner from "../components/LoadingSpinner";

const AiChat = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const data = await getAiModels();
        setModels(data.models || []);
        setSelectedModel(data.defaultModel || "");
      } catch {
        // ignore model list errors; we can still chat with backend default
      }
    };

    if (isAuthenticated) {
      loadModels();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  if (!user) {
    return <LoadingSpinner text="Loading AI assistant..." />;
  }

  const handleSend = async () => {
    setError("");
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input.trim()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      setLoading(true);
      const reply = await sendAiMessage({
        message: userMessage.content,
        model: selectedModel || undefined
      });
      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: reply
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message || "Failed to get AI response");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) {
        handleSend();
      }
    }
  };

  return (
    <div className="dashboard-container ai-chat-page">
      <nav className="dashboard-nav fade-in">
        <div className="nav-brand">
          <MessageCircle size={32} style={{ color: "var(--color-primary-600)" }} />
          <h2>AI Study Assistant</h2>
        </div>
        <div className="nav-links">
          <button
            type="button"
            className="nav-link"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section fade-in" style={{ marginBottom: "1.5rem" }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1>Chat with your campus AI</h1>
            <p className="user-info">
              Ask questions about study plans, time management, or anything related to your
              university life. The AI will keep answers short and practical.
            </p>
          </div>
        </div>

        {models.length > 0 && (
          <div className="card fade-in" style={{ marginBottom: "1.5rem" }}>
            <div className="card-body" style={{ marginBottom: 0 }}>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Model</label>
                  <select
                    className="form-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={loading}
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <div className="card fade-in">
          <div className="card-body ai-chat-messages">
            {messages.length === 0 && (
              <div className="empty-state">
                <p style={{ opacity: 0.8 }}>
                  Start the conversation by telling the AI what you&apos;re working on today.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}`}
              >
                <div className="chat-bubble-content">{msg.content}</div>
              </div>
            ))}

            {loading && (
              <div className="chat-bubble chat-bubble-ai">
                <div className="chat-bubble-content" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Loader2 size={16} className="spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>
          <div className="card-footer ai-chat-input-footer">
            <div className="form-field">
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Ask anything about your schedule, exams, or study plan..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="ai-chat-send-row">
              <button
                type="button"
                className={`btn btn-primary btn-sm ${loading ? "loading" : ""}`}
                onClick={handleSend}
                disabled={loading || !input.trim()}
              >
                <Send size={16} />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChat;

