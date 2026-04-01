import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  Plus,
  Filter,
  ThumbsUp,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Pin,
  Link as LinkIcon,
  Check,
  FileText,
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
import ErrorMessage from "../components/ErrorMessage";
import "../styles/Dashboard.css";
import "../styles/Notes.css";

const Notes = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { notes, loading, error, pagination, filters, searchQuery } =
    useSelector((state) => state.notes);

  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery || "");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const searchTimeoutRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      dispatch(setSearchQuery(localSearch));
      setCurrentPage(1);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [localSearch, dispatch]);

  const loadNotes = useCallback(() => {
    const params = { page: currentPage, limit: 12 };
    if (filters.subject) params.subject = filters.subject;
    if (filters.year) params.year = filters.year;
    if (filters.tag) params.tag = filters.tag;
    if (sortBy) params.sort = sortBy;

    if (localSearch.trim()) {
      params.q = localSearch.trim();
      dispatch(searchNotesAction(params));
    } else {
      dispatch(fetchNotes(params));
    }
  }, [dispatch, currentPage, filters, localSearch, sortBy]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setLocalSearch("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const handleCreateNote = async (noteData) => {
    const result = await dispatch(createNoteAction(noteData));
    return result;
  };

  const handleReaction = (noteId, type) => {
    dispatch(reactToNoteAction({ noteId, type }));
  };

  const hasActiveFilters = filters.subject || filters.year || filters.tag || localSearch;

  const sortedNotes = [...notes].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "mostLiked":
        return (b.reactionsCount?.like || 0) - (a.reactionsCount?.like || 0);
      case "mostCommented":
        return (b.commentsCount || 0) - (a.commentsCount || 0);
      default:
        return 0;
    }
  });

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
      {/* Decorative Background: Profile-style Orbs */}
      <div className="pr-canvas" />

      <div className="notes-container">
        {/* Top Bar / Breadcrumbs */}
        <div className="pr-topbar">
          <div className="pr-topbar__left">
            <button className="pr-back-btn" onClick={() => navigate(-1)} title="Go Back">
              <ChevronLeft size={20} />
            </button>
            <div className="pr-topbar__breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <ChevronRight size={16} />
              <span className="pr-topbar__page">Knowledge Hub</span>
            </div>
          </div>
          <div className="pr-topbar__meta">
            <span>{pagination?.total || notes.length} Resources Available</span>
          </div>
        </div>

        {/* Modern Hero Section */}
        <section className="notes-hero">
          <div className="notes-hero-text">
            <p className="notes-hero__role">Academic Repository</p>
            <h1 className="notes-hero-title">Knowledge Hub</h1>
            <p className="notes-hero-subtitle">
              Access and contribute to a shared library of verified academic notes, 
              research materials, and study guides.
            </p>
          </div>
          <div className="notes-hero-actions">
            <button
              className="btn-new-note"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCreateDrawer(true);
              }}
            >
              <Plus size={18} />
              <span>Create Note</span>
            </button>
          </div>
        </section>

        {/* Modern Integrated Toolbar */}
        <div className="notes-toolbar">
          <div className="notes-toolbar__inner">
            <div className="notes-search">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search by title, tags or content..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {localSearch && (
                <button
                  className="search-clear"
                  onClick={(e) => { e.stopPropagation(); setLocalSearch(""); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--n-text-muted)', cursor: 'pointer', paddingRight: '1rem', borderRadius: '50%' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              className="filter-chip"
              value={filters.subject}
              onChange={(e) => handleFilterChange("subject", e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              className="filter-chip"
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
            >
              <option value="">All Levels</option>
              {[1, 2, 3, 4].map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>

            <select
              className="filter-chip"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="mostLiked">Most Popular</option>
              <option value="mostCommented">Best Discussed</option>
            </select>

            {hasActiveFilters && (
              <button
                className="filter-chip"
                onClick={handleClearFilters}
                style={{ color: 'var(--n-accent)' }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Error Handling */}
        {error && <ErrorMessage message={error} onRetry={loadNotes} />}

        {/* Archive Loading Interface */}
        {loading && (
          <div className="notes-grid">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Archive Empty State */}
        {!loading && notes.length === 0 && (
          <div className="notes-empty-state">
            <div className="empty-illustration">
              <FileText size={48} className="empty-icon" />
              <p>No resources found matching your criteria.</p>
            </div>
            {!localSearch && (
              <button
                className="btn-new-note"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCreateDrawer(true);
                }}
              >
                <Plus size={18} />
                Create First Note
              </button>
            )}
          </div>
        )}

        {/* Archive Manifest (Grid) */}
        {!loading && notes.length > 0 && (
          <>
            <div className="notes-grid">
              {sortedNotes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  currentUserId={user?._id}
                  onReaction={handleReaction}
                  onViewComments={() => navigate(`/notes/${note._id}`)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.pages > 1 && (
              <div className="notes-pagination">
                <button
                  className="pagination-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="pagination-pages">
                  {[...Array(pagination.pages)].map((_, i) => {
                    const page = i + 1;
                    const isActive = page === currentPage;
                    if (Math.abs(page - currentPage) > 2 && page !== 1 && page !== pagination.pages) return null;
                    return (
                      <button
                        key={page}
                        className={`pagination-page ${isActive ? "active" : ""}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="pagination-btn"
                  disabled={currentPage >= pagination.pages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Note Modal */}
      <CreateNoteModal
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateNote}
        loading={loading}
      />
    </div>
  );
};

// Tactical Subcomponents
const SkeletonCard = () => (
  <div className="note-card skeleton">
    <div className="skeleton-title" />
    <div className="skeleton-body">
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
    <div className="skeleton-tags">
      <div className="skeleton-tag" />
      <div className="skeleton-tag" />
    </div>
    <div className="skeleton-footer">
      <div className="skeleton-timestamp" />
      <div className="skeleton-actions">
        <div className="skeleton-action" />
        <div className="skeleton-action" />
      </div>
    </div>
  </div>
);

const NoteCard = ({ note, currentUserId, onReaction, onViewComments }) => {
  const [isPinned, setIsPinned] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePin = (e) => {
    e.stopPropagation();
    setIsPinned(!isPinned);
  };

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/notes/${note._id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  const isLiked = note._userReaction === "like";
  const likeCount = note.reactionsCount?.like || 0;
  const commentCount = note.commentsCount || 0;

  return (
    <div className={`note-card ${isPinned ? "pinned" : ""}`} onClick={onViewComments}>
      <div className="note-card-header">
        <h3 className="note-title">{note.title}</h3>
        {isPinned && <Pin size={16} color="var(--n-accent)" fill="currentColor" className="pin-icon" />}
      </div>
      <p className="note-body">{note.description}</p>

      {note.tags && note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="note-tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="note-footer">
        <span className="note-author">By {note.userId?.name?.split(" ")[0] || "Scholar"}</span>
        <div className="note-actions">
          <button
            className={`action-btn ${isLiked ? "active" : ""}`}
            onClick={(e) => { e.stopPropagation(); onReaction(note._id, "like"); }}
            title="Like"
          >
            <ThumbsUp size={16} />
            {likeCount > 0 && <span className="action-count">{likeCount}</span>}
          </button>
          <button className="action-btn" onClick={(e) => { e.stopPropagation(); onViewComments(); }} title="Comments">
            <MessageSquare size={16} />
            {commentCount > 0 && <span className="action-count">{commentCount}</span>}
          </button>
          <button className="action-btn" onClick={handleCopyLink} title="Copy Link">
            {copied ? <Check size={16} color="var(--n-accent)" /> : <LinkIcon size={16} />}
          </button>
          <button className={`action-btn ${isPinned ? "active" : ""}`} onClick={handlePin} title="Pin">
            <Pin size={16} fill={isPinned ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
};

const FACULTY_DATA = {
  "Faculty of Computing": [
    "Department of IT",
    "Department of Cybersecurity",
    "Department of Network Engineering",
    "Department of Computer Science",
    "Department of Data Science",
    "Department of Software Engineering"
  ],
  "Faculty of Business": [
    "Department of Management",
    "Department of Accounting and Finance",
    "Department of Marketing",
    "Department of Human Resource Management",
    "Department of Logistics and Supply Chain",
    "Department of Economics"
  ],
  "Faculty of Engineering": [
    "Department of Civil Engineering",
    "Department of Electrical and Electronic Engineering",
    "Department of Mechanical Engineering",
    "Department of Mechatronics Engineering"
  ],
  "Faculty of Medicine": [
    "Department of Anatomy",
    "Department of Physiology",
    "Department of Biochemistry",
    "Department of Pathology",
    "Department of Pharmacology"
  ],
  "Faculty of Law": [
    "Department of Public and International Law",
    "Department of Private and Comparative Law",
    "Department of Commercial Law"
  ],
  "Faculty of Architecture": [
    "Department of Architecture",
    "Department of Quantity Surveying",
    "Department of Town and Country Planning"
  ],
  "Faculty of Humanities and Sciences": [
    "Department of English and Modern Languages",
    "Department of Social Sciences",
    "Department of Physical Education",
    "Department of Mathematics and Statistics"
  ]
};

const CreateNoteModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({ 
    title: "", 
    description: "", 
    onedriveLink: "", 
    tags: "", 
    faculty: "",
    department: "",
    subject: "",
    year: "" 
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ 
        title: "", 
        description: "", 
        onedriveLink: "", 
        tags: "", 
        faculty: "",
        department: "",
        subject: "",
        year: "" 
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateSubject = (value) => {
    if (!value.trim()) return "Subject is required";
    if (!/^[a-zA-Z\s]+$/.test(value)) return "Only letters and spaces allowed";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "faculty") {
      setFormData(prev => ({
        ...prev,
        faculty: value,
        department: ""
      }));
    } else if (name === "subject") {
      // Only allow letters and spaces
      if (value === "" || /^[a-zA-Z\s]*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {
      title: !formData.title.trim() ? "Title is required" : "",
      description: !formData.description.trim() ? "Description is required" : "",
      faculty: !formData.faculty ? "Please select a faculty" : "",
      department: !formData.department ? "Please select a department" : "",
      subject: validateSubject(formData.subject)
    };
    
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(err => err)) return;

    setIsSubmitting(true);
    const res = await onSubmit({
      title: formData.title,
      description: formData.description,
      onedriveLink: formData.onedriveLink,
      tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
      faculty: formData.faculty,
      department: formData.department,
      subject: formData.subject,
      year: formData.year ? Number(formData.year) : null
    });
    setIsSubmitting(false);
    if (!res.error) onClose();
  };

  if (!isOpen) return null;

  const faculties = Object.keys(FACULTY_DATA);
  const departments = formData.faculty ? FACULTY_DATA[formData.faculty] : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Create New Resource</h2>
            <p className="modal-subtitle">Share your knowledge with the campus community</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Title <span className="required">*</span></label>
            <input 
              type="text" 
              name="title"
              placeholder="e.g. Advanced Calculus Notes" 
              value={formData.title} 
              onChange={handleChange}
              className={errors.title ? "error" : ""}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label>Description <span className="required">*</span></label>
            <textarea 
              name="description"
              placeholder="Briefly describe what this note covers..." 
              rows={4} 
              value={formData.description} 
              onChange={handleChange}
              className={errors.description ? "error" : ""}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Faculty <span className="required">*</span></label>
              <select 
                name="faculty"
                value={formData.faculty} 
                onChange={handleChange}
                className={errors.faculty ? "error" : ""}
              >
                <option value="">Select Faculty</option>
                {faculties.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              {errors.faculty && <span className="error-text">{errors.faculty}</span>}
            </div>
            <div className="form-group half">
              <label>Department <span className="required">*</span></label>
              <select 
                name="department"
                value={formData.department} 
                onChange={handleChange}
                disabled={!formData.faculty}
                className={errors.department ? "error" : ""}
              >
                <option value="">{formData.faculty ? "Select Department" : "Select Faculty First"}</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <span className="error-text">{errors.department}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Subject <span className="required">*</span></label>
              <input 
                type="text" 
                name="subject"
                placeholder="e.g. Calculus, Physics" 
                value={formData.subject} 
                onChange={handleChange}
                className={errors.subject ? "error" : ""}
              />
              {errors.subject && <span className="error-text">{errors.subject}</span>}
              <span className="field-hint">Letters and spaces only</span>
            </div>
            <div className="form-group half">
              <label>Year Level</label>
              <select 
                name="year"
                value={formData.year} 
                onChange={handleChange}
              >
                <option value="">Select Year</option>
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Tags (Optional)</label>
            <input 
              type="text" 
              name="tags"
              placeholder="math, exam, 2024... (comma separated)" 
              value={formData.tags} 
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>External Link (Optional)</label>
            <input 
              type="url" 
              name="onedriveLink"
              placeholder="Google Drive, OneDrive, Dropbox link..." 
              value={formData.onedriveLink} 
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? "Publishing..." : "Publish Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const ActiveFilterPill = ({ label, value, onRemove }) => (
  <span className="active-filter-pill">
    <span className="filter-label">{label}:</span>
    <span className="filter-value">{value}</span>
    <button
      className="filter-remove"
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
    >
      <X size={12} />
    </button>
  </span>
);

export default Notes;
