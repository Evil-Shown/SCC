import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  ExternalLink,
  Send,
  UserRound,
  BookOpen,
  GraduationCap,
  CalendarDays,
  Tag,
} from "lucide-react";
import {
  reactToNoteAction,
  fetchCommentsAction,
  addCommentAction,
  fetchNotes,
} from "../features/notes/notesSlice";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/Notes.css";

const NoteDetail = () => {
  const { noteId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
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

  const handleBack = () => {
    navigate(location.state?.from || "/notes");
  };

  if (!note) {
    return (
      <div className="notes-page">
        <header className="notes-header">
          <div className="notes-header-left">
            <button onClick={handleBack} className="back-btn">
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
  const publishedOn = new Date(note.createdAt).toLocaleDateString();
  const likesCount = note.reactionsCount?.like || note.reactionsCount?.likes || 0;

  return (
    <div className="notes-page">
      <div className="pr-canvas" />

      <div className="notes-container">
        <section className="notes-hero notes-hero--detail">
          <div className="notes-hero-content">
            <button className="notes-hero-back" onClick={handleBack} title="Go Back">
              <ArrowLeft size={20} />
            </button>

            <div className="notes-hero-main">
              <div className="notes-hero-text">
                <p className="notes-hero__role">Knowledge Hub Entry</p>
                <h1 className="notes-hero-title notes-hero-title--detail">{note.title}</h1>
                <p className="notes-hero-subtitle">
                  Published by {authorName} on {publishedOn}
                </p>
              </div>

              <div className="notes-hero-metrics notes-hero-metrics--detail">
                <div className="hero-metric-card">
                  <span className="hero-metric-label">Subject</span>
                  <strong className="hero-metric-value">{note.subject || "General"}</strong>
                </div>
                <div className="hero-metric-card">
                  <span className="hero-metric-label">Year</span>
                  <strong className="hero-metric-value">{note.year ? `Y${note.year}` : "All"}</strong>
                </div>
                <div className="hero-metric-card">
                  <span className="hero-metric-label">Comments</span>
                  <strong className="hero-metric-value">{note.commentsCount || 0}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="note-detail-container">
          <div className="note-detail-layout">
            <article className="note-detail-card">
              <div className="note-detail-header">
                <div className="note-detail-avatar">
                  <span>{authorName.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h1 className="note-detail-title">{note.title}</h1>
                  <div className="note-detail-meta">
                    <span><UserRound size={14} /> {authorName}</span>
                    {note.subject && <span><BookOpen size={14} /> {note.subject}</span>}
                    {note.year && <span><GraduationCap size={14} /> Year {note.year}</span>}
                    <span><CalendarDays size={14} /> {publishedOn}</span>
                  </div>
                </div>
              </div>

              {note.tags && note.tags.length > 0 && (
                <div className="note-detail-tags">
                  {note.tags.map((tag, i) => (
                    <span key={i} className="note-detail-tag"><Tag size={13} /> {tag}</span>
                  ))}
                </div>
              )}

              <div className="note-detail-content">
                {note.description}
              </div>

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
                  <span>{likesCount} Helpful</span>
                </button>
              </div>
            </article>

            <aside className="note-insight-panel">
              <h3>Insight Panel</h3>
              <div className="note-insight-grid">
                <div className="note-insight-item">
                  <span className="label">Author</span>
                  <strong>{authorName}</strong>
                </div>
                <div className="note-insight-item">
                  <span className="label">Subject</span>
                  <strong>{note.subject || "General"}</strong>
                </div>
                <div className="note-insight-item">
                  <span className="label">Year Level</span>
                  <strong>{note.year ? `Year ${note.year}` : "All"}</strong>
                </div>
                <div className="note-insight-item">
                  <span className="label">Comments</span>
                  <strong>{note.commentsCount || 0}</strong>
                </div>
              </div>
            </aside>
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
