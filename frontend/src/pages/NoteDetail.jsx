import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ExternalLink,
  Tag,
  Calendar,
  BookOpen,
  Send,
  User,
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
  const authorDept = note.userId?.department || "";
  const authorEmail = note.userId?.email || "";
  const dateStr = new Date(note.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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

      <div className="note-detail-container">
        {/* Main Note */}
        <div className="note-detail-card">
          <div className="note-detail-author">
            <div className="note-avatar large">
              {note.userId?.profilePicture ? (
                <img src={note.userId.profilePicture} alt={authorName} />
              ) : (
                <span>{authorName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <span className="note-author-name">{authorName}</span>
              <span className="note-meta">{authorDept}</span>
              <span className="note-meta">{authorEmail}</span>
            </div>
            <span className="note-date">
              <Calendar size={14} /> {dateStr}
            </span>
          </div>

          <h2 className="note-detail-title">{note.title}</h2>
          <p className="note-detail-description">{note.description}</p>

          <div className="note-detail-meta">
            {note.subject && (
              <span className="note-subject-badge">
                <BookOpen size={14} /> {note.subject}
              </span>
            )}
            {note.year && (
              <span className="note-subject-badge">
                Year {note.year}
              </span>
            )}
          </div>

          {note.tags && note.tags.length > 0 && (
            <div className="note-tags">
              {note.tags.map((tag, i) => (
                <span key={i} className="note-tag">
                  <Tag size={12} /> {tag}
                </span>
              ))}
            </div>
          )}

          {note.onedriveLink && (
            <a
              href={note.onedriveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="note-link large"
            >
              <ExternalLink size={18} />
              Open in OneDrive
            </a>
          )}

          <div className="note-detail-actions">
            <button
              className={`reaction-btn large ${note._userReaction === "like" ? "active-like" : ""}`}
              onClick={() => handleReaction("like")}
            >
              <ThumbsUp size={20} />
              <span>{note.reactionsCount?.likes || 0} Likes</span>
            </button>
            <button
              className={`reaction-btn large ${note._userReaction === "dislike" ? "active-dislike" : ""}`}
              onClick={() => handleReaction("dislike")}
            >
              <ThumbsDown size={20} />
              <span>{note.reactionsCount?.dislikes || 0} Dislikes</span>
            </button>
            <div className="comment-count-badge">
              <MessageSquare size={20} />
              <span>{note.commentsCount || 0} Comments</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="comments-section">
          <h3 className="comments-title">
            <MessageSquare size={20} />
            Comments ({note.commentsCount || 0})
          </h3>

          <form onSubmit={handleComment} className="comment-form">
            <div className="comment-input-wrapper">
              <div className="note-avatar small">
                <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
              </div>
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="comment-send-btn"
              >
                <Send size={18} />
              </button>
            </div>
          </form>

          {commentsLoading && <LoadingSpinner size="sm" text="Loading comments..." />}

          {!commentsLoading && noteComments.length === 0 && (
            <div className="no-comments">
              <MessageSquare size={24} />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}

          <div className="comments-list">
            {noteComments.map((comment) => (
              <div key={comment._id} className="comment-item fade-in">
                <div className="note-avatar small">
                  {comment.userId?.profilePicture ? (
                    <img
                      src={comment.userId.profilePicture}
                      alt={comment.userId?.name}
                    />
                  ) : (
                    <span>
                      {comment.userId?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-author">
                      {comment.userId?.name || "Anonymous"}
                    </span>
                    <span className="comment-time">
                      {new Date(comment.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(comment.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="comment-text">{comment.commentText}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetail;
