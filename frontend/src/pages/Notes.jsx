import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  Plus,
  Filter,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ExternalLink,
  Tag,
  Calendar,
  User,
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import {
  fetchNotes,
  searchNotesAction,
  createNoteAction,
  reactToNoteAction,
  setFilters,
  clearFilters,
  setSearchQuery,
} from "../features/notes/notesSlice";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import "../styles/Notes.css";

const Notes = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { notes, loading, error, pagination, filters, searchQuery } =
    useSelector((state) => state.notes);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery || "");
  const [currentPage, setCurrentPage] = useState(1);

  // Create form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    onedriveLink: "",
    tags: "",
    subject: "",
    year: "",
  });
  const [formError, setFormError] = useState("");

  const loadNotes = useCallback(() => {
    const params = { page: currentPage, limit: 12 };
    if (filters.subject) params.subject = filters.subject;
    if (filters.year) params.year = filters.year;
    if (filters.tag) params.tag = filters.tag;

    if (localSearch.trim()) {
      params.q = localSearch.trim();
      dispatch(searchNotesAction(params));
    } else {
      dispatch(fetchNotes(params));
    }
  }, [dispatch, currentPage, filters, localSearch]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    dispatch(setSearchQuery(localSearch));
    loadNotes();
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setLocalSearch("");
    setCurrentPage(1);
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim() || !formData.description.trim()) {
      setFormError("Title and description are required");
      return;
    }

    const noteData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      onedriveLink: formData.onedriveLink.trim(),
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      subject: formData.subject.trim(),
      year: formData.year ? Number(formData.year) : null,
    };

    const result = await dispatch(createNoteAction(noteData));
    if (!result.error) {
      setShowCreateModal(false);
      setFormData({
        title: "",
        description: "",
        onedriveLink: "",
        tags: "",
        subject: "",
        year: "",
      });
    } else {
      setFormError(result.payload || "Failed to create note");
    }
  };

  const handleReaction = (noteId, type) => {
    dispatch(reactToNoteAction({ noteId, type }));
  };

  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Engineering",
    "Business",
    "Economics",
    "English",
    "History",
  ];

  return (
    <div className="notes-page">
      {/* Header */}
      <header className="notes-header">
        <div className="notes-header-left">
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Notes Sharing</h1>
            <p>Share and discover study materials</p>
          </div>
        </div>
        <div className="notes-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            <span>Share Note</span>
          </button>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="notes-toolbar">
        <form onSubmit={handleSearch} className="notes-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search notes by title, tags, description..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {localSearch && (
            <button
              type="button"
              className="search-clear"
              onClick={() => {
                setLocalSearch("");
                dispatch(setSearchQuery(""));
                setCurrentPage(1);
              }}
            >
              <X size={16} />
            </button>
          )}
        </form>
        <button
          className={`filter-toggle ${showFilters ? "active" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          <span>Filters</span>
          {(filters.subject || filters.year || filters.tag) && (
            <span className="filter-badge">!</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="notes-filters fade-in">
          <div className="filter-group">
            <label>Subject</label>
            <select
              value={filters.subject}
              onChange={(e) => handleFilterChange("subject", e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Year</label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
            >
              <option value="">All Years</option>
              {[1, 2, 3, 4, 5, 6].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleClearFilters}>
            Clear All
          </button>
        </div>
      )}

      {/* Error */}
      {error && <ErrorMessage message={error} onRetry={loadNotes} />}

      {/* Loading */}
      {loading && <LoadingSpinner text="Loading notes..." />}

      {/* Notes Grid */}
      {!loading && notes.length === 0 && (
        <EmptyState
          icon="📝"
          title="No notes found"
          description={
            searchQuery
              ? `No results for "${searchQuery}"`
              : "Be the first to share study notes!"
          }
          action={() => setShowCreateModal(true)}
          actionText="Share Note"
        />
      )}

      {!loading && notes.length > 0 && (
        <>
          <div className="notes-grid">
            {notes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                currentUserId={user?._id}
                onReaction={handleReaction}
                onViewComments={() => navigate(`/notes/${note._id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="notes-pagination">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span>
                Page {currentPage} of {pagination.pages}
              </span>
              <button
                disabled={currentPage >= pagination.pages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Note Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Share a Note</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateNote} className="note-form">
              {formError && (
                <div className="form-error">{formError}</div>
              )}
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures — Linked Lists"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  maxLength={200}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  placeholder="Briefly describe the content of your notes..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  required
                />
              </div>
              <div className="form-group">
                <label>OneDrive Link</label>
                <input
                  type="url"
                  placeholder="https://onedrive.live.com/..."
                  value={formData.onedriveLink}
                  onChange={(e) =>
                    setFormData({ ...formData, onedriveLink: e.target.value })
                  }
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                  >
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                  >
                    <option value="">Select year</option>
                    {[1, 2, 3, 4, 5, 6].map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. algorithms, sorting, trees"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Sharing..." : "Share Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Note Card Component
const NoteCard = ({ note, currentUserId, onReaction, onViewComments }) => {
  const authorName = note.userId?.name || "Anonymous";
  const authorDept = note.userId?.department || "";
  const authorYear = note.userId?.year ? `Year ${note.userId.year}` : "";
  const dateStr = new Date(note.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="note-card fade-in">
      <div className="note-card-header">
        <div className="note-author">
          <div className="note-avatar">
            {note.userId?.profilePicture ? (
              <img src={note.userId.profilePicture} alt={authorName} />
            ) : (
              <span>{authorName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <span className="note-author-name">{authorName}</span>
            <span className="note-meta">
              {[authorDept, authorYear].filter(Boolean).join(" · ")}
            </span>
          </div>
        </div>
        <span className="note-date">
          <Calendar size={14} /> {dateStr}
        </span>
      </div>

      <h3 className="note-title">{note.title}</h3>
      <p className="note-description">{note.description}</p>

      {note.subject && (
        <span className="note-subject-badge">
          <BookOpen size={14} /> {note.subject}
        </span>
      )}

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
          className="note-link"
        >
          <ExternalLink size={16} />
          Open in OneDrive
        </a>
      )}

      <div className="note-card-footer">
        <div className="note-reactions">
          <button
            className={`reaction-btn ${note._userReaction === "like" ? "active-like" : ""}`}
            onClick={() => onReaction(note._id, "like")}
          >
            <ThumbsUp size={16} />
            <span>{note.reactionsCount?.likes || 0}</span>
          </button>
          <button
            className={`reaction-btn ${note._userReaction === "dislike" ? "active-dislike" : ""}`}
            onClick={() => onReaction(note._id, "dislike")}
          >
            <ThumbsDown size={16} />
            <span>{note.reactionsCount?.dislikes || 0}</span>
          </button>
        </div>
        <button className="comment-btn" onClick={onViewComments}>
          <MessageSquare size={16} />
          <span>{note.commentsCount || 0} Comments</span>
        </button>
      </div>
    </div>
  );
};

export default Notes;
