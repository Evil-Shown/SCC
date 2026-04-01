import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  ExternalLink,
  Send,
  ChevronRight,
} from "lucide-react";
import {
  reactToNoteAction,
  fetchCommentsAction,
  addCommentAction,
  fetchNotes,
} from "../features/notes/notesSlice";
import LoadingSpinner from "../components/LoadingSpinner";
import NotificationBell from "../components/NotificationBell";
import "../styles/Notes.css";

const NoteDetail = () => {
  const { noteId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { notes, comments, commentsLoading } = useSelector(
    (state) => state.notes
  );

  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const note = notes.find((n) => n._id === noteId);
  const noteComments = comments[noteId] || [];

  useEffect(() => {
    if (!note) {
      dispatch(fetchNotes({}));
    }
    dispatch(fetchCommentsAction({ noteId }));
  }, [dispatch, noteId, note]);

  const handleReaction = (type) => {
    dispatch(reactToNoteAction({ noteId, type }));
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    await dispatch(addCommentAction({ noteId, commentText: commentText.trim() }));
    setCommentText("");
    setSubmitting(false);
  };

  if (!note) {
    return (
      <div className="notes-page">
        <header className="notes-header">
          <div className="notes-header-left">
            <button onClick={() => navigate("/notes")} className="back-btn">
              <ArrowLeft size={20} />
            </button>
            <h1>Note Details</h1>
          </div>
        </header>
        <LoadingSpinner text="Loading note..." />
      </div>
    );
  }

  const authorName = note.userId?.name || "Anonymous";

  return (
    <div className="notes-page">
      <div className="pr-canvas" />

      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          <Link to="/dashboard" className="dashboard-logo">
            <span className="dashboard-logo__text">Neural Nexus</span>
          </Link>
          <div className="dashboard-actions">
            <NotificationBell />
            <button
              className="dashboard-profile-btn"
              onClick={() => navigate("/profile")}
            >
              <span className="dashboard-avatar">
                {user?.name?.charAt(0) || "U"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="notes-container">
        <div className="pr-topbar">
          <div className="pr-topbar__left">
            <button className="pr-back-btn" onClick={() => navigate("/notes")} title="Go Back">
              <ArrowLeft size={20} />
            </button>
            <div className="pr-topbar__breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <ChevronRight size={16} style={{ color: 'var(--n-text-muted)' }} />
              <Link to="/notes">Notes</Link>
              <ChevronRight size={16} style={{ color: 'var(--n-text-muted)' }} />
              <span className="pr-topbar__page">{note.title}</span>
            </div>
          </div>
          <div className="pr-topbar__meta">
            <span>Published on {new Date(note.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="note-detail-container">
          <div className="note-detail-card">
            <div className="note-detail-header">
              <div className="note-detail-avatar">
                <span>{authorName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h1 className="note-detail-title">{note.title}</h1>
                <div className="note-detail-meta">
                  <span>By {authorName}</span>
                  {note.subject && <span>• {note.subject}</span>}
                  {note.year && <span>• Year {note.year}</span>}
                </div>
              </div>
            </div>

            <div className="note-detail-content">
              {note.description}
            </div>

            {note.tags && note.tags.length > 0 && (
              <div className="note-detail-tags">
                {note.tags.map((tag, i) => (
                  <span key={i} className="note-detail-tag">{tag}</span>
                ))}
              </div>
            )}

            <div className="note-detail-actions">
              {note.onedriveLink && (
                <a
                  href={note.onedriveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="note-detail-btn primary"
                >
                  <ExternalLink size={18} />
                  Access Resource Files
                </a>
              )}
              <button
                className={`note-detail-btn secondary ${note._userReaction === "like" ? "active" : ""}`}
                onClick={() => handleReaction("like")}
              >
                <ThumbsUp size={18} />
                <span>{note.reactionsCount?.likes || 0} Helpful</span>
              </button>
            </div>
          </div>

          <div className="comments-section">
            <h3 className="comments-header">
              <MessageSquare size={20} />
              Discussion ({note.commentsCount || 0})
            </h3>

            <form onSubmit={handleComment} className="comment-form">
              <div className="comment-input-wrapper">
                <input
                  type="text"
                  placeholder="Share your thoughts or ask a question..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || submitting}
                  className="comment-submit-btn"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>

            <div className="comments-list">
              {noteComments.map((comment, index) => (
                <div 
                  key={comment._id} 
                  className="comment-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="comment-header">
                    <span className="comment-author">
                      {comment.userId?.name || "Scholar"}
                    </span>
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="comment-text">
                    {comment.commentText}
                  </div>
                </div>
              ))}
              {noteComments.length === 0 && (
                <div className="no-comments">
                  No comments yet. Start the discussion!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetail;
