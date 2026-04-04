import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Calendar,
  Users,
  Link as LinkIcon,
  Video,
  Download,
  Clock,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  BookOpen,
  Search,
  Sparkles,
  GraduationCap,
  Info,
  Loader,
} from "lucide-react";
import {
  fetchKuppiPosts,
  createKuppiAction,
  applyToKuppiAction,
  addMeetingLinkAction,
  fetchApplicantsAction,
} from "../features/kuppi/kuppiSlice";
import { exportApplicants } from "../services/kuppiService";
import ErrorMessage from "../components/ErrorMessage";
import { notifyError, notifySuccess } from "../utils/toast";
import "../styles/Kuppi.css";

const Kuppi = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { posts, loading, error, pagination } = useSelector((state) => state.kuppi);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(null);
  const [showApplicantsModal, setShowApplicantsModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    eventDate: "",
    meetingLink: "",
  });
  const [formError, setFormError] = useState("");
  const [meetingLinkInput, setMeetingLinkInput] = useState("");

  const loadPosts = useCallback(() => {
    const params = { page: currentPage, limit: 12 };
    if (activeTab === "mine" && user?._id) {
      params.ownerId = user._id;
    }
    dispatch(fetchKuppiPosts(params));
  }, [dispatch, currentPage, activeTab, user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleCreatePost = async (e) => {
    e?.preventDefault?.();
    setFormError("");

    if (!formData.title.trim() || !formData.description.trim() || !formData.eventDate) {
      setFormError("Title, description, and event date are required");
      return;
    }

    const selectedDate = new Date(formData.eventDate);
    const now = new Date();
    if (selectedDate <= now) {
      setFormError("Please select a future date and time");
      return;
    }

    const result = await dispatch(createKuppiAction({
      title: formData.title.trim(),
      description: formData.description.trim(),
      subject: formData.subject.trim(),
      eventDate: formData.eventDate,
      meetingLink: formData.meetingLink.trim(),
    }));
    if (!result.error) {
      setShowCreateModal(false);
      setFormData({ title: "", description: "", subject: "", eventDate: "", meetingLink: "" });
      notifySuccess("Kuppi session created successfully!");
    } else {
      setFormError(result.payload || "Failed to create post");
      notifyError(result.payload || "Failed to create post");
    }
  };

  const handleApply = async (postId) => {
    const result = await dispatch(applyToKuppiAction(postId));
    if (!result.error) {
      notifySuccess("Applied successfully!");
    } else {
      notifyError(result.payload || "Failed to apply");
    }
  };

  const handleAddLink = async (postId) => {
    if (!meetingLinkInput.trim()) return;
    const result = await dispatch(addMeetingLinkAction({ postId, meetingLink: meetingLinkInput.trim() }));
    if (!result.error) {
      setShowLinkModal(null);
      setMeetingLinkInput("");
      notifySuccess("Meeting link added & notifications sent!");
    } else {
      notifyError(result.payload || "Failed to add meeting link");
    }
  };

  const handleViewApplicants = (postId) => {
    setShowApplicantsModal(postId);
    dispatch(fetchApplicantsAction(postId));
  };

  const handleExport = async (postId) => {
    try {
      await exportApplicants(postId);
      notifySuccess("Excel file downloaded!");
    } catch (err) {
      notifyError("Failed to export applicants");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "scheduled": return { bg: "#10b981", text: "#ffffff" };
      case "completed": return { bg: "#065f46", text: "#d1fae5" };
      case "cancelled": return { bg: "#ef4444", text: "#ffffff" };
      default: return { bg: "#34d399", text: "#064e3b" };
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Engineering", "Business", "Economics", "English", "History"];

  return (
    <div className="kuppi-container">
      {/* Background Effects */}
      <div className="kuppi-bg">
        <div className="leaf leaf-1" />
        <div className="leaf leaf-2" />
        <div className="leaf leaf-3" />
      </div>

      {/* Hero Section */}
      <section className="kuppi-hero">
        <div className="kuppi-hero-content">
          <button className="kuppi-back" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={20} />
          </button>
          <div className="kuppi-hero-text">
            <span className="kuppi-badge">
              <Sparkles size={14} />
              Peer Learning
            </span>
            <h1>Kuppi Sessions</h1>
            <p>Learn together, grow together. Join or host peer tutoring sessions.</p>
          </div>
          <button className="kuppi-create-btn" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            Create Session
          </button>
        </div>
      </section>

      {/* Controls */}
      <div className="kuppi-controls">
        <div className="kuppi-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="kuppi-tabs">
          <button
            className={activeTab === "all" ? "active" : ""}
            onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
          >
            All Sessions
          </button>
          <button
            className={activeTab === "mine" ? "active" : ""}
            onClick={() => { setActiveTab("mine"); setCurrentPage(1); }}
          >
            My Sessions
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="kuppi-main">
        {error && <ErrorMessage message={error} onRetry={loadPosts} />}

        {loading ? (
          <div className="kuppi-loading">
            <div className="spinner" />
            <span>Loading sessions...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="kuppi-empty">
            <div className="empty-icon">
              <GraduationCap size={64} />
            </div>
            <h3>No sessions found</h3>
            <p>{searchQuery ? "Try a different search term" : activeTab === "mine" ? "Create your first kuppi session!" : "Be the first to create a session!"}</p>
            <button className="kuppi-create-btn" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} />
              Create Session
            </button>
          </div>
        ) : (
          <>
            <div className="kuppi-grid">
              {filteredPosts.map((post, idx) => (
                <SessionCard
                  key={post._id}
                  post={post}
                  user={user}
                  index={idx}
                  onApply={handleApply}
                  onAddLink={setShowLinkModal}
                  onViewApplicants={handleViewApplicants}
                  onExport={handleExport}
                  getStatusStyle={getStatusStyle}
                  setMeetingLinkInput={setMeetingLinkInput}
                />
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="kuppi-pagination">
                <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft size={24} />
                </button>
                <span>Page {currentPage} of {pagination.pages}</span>
                <button disabled={currentPage >= pagination.pages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight size={24} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="kuppi-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="kuppi-modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>Create New Session</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form className="kuppi-form" onSubmit={handleCreatePost}>
              {formError && (
                <div className="form-error">
                  <AlertCircle size={16} />
                  {formError}
                </div>
              )}
              <div className="form-field">
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Calculus Revision Session"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Description *</label>
                <textarea
                  placeholder="What will you cover in this session?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Date & Time *</label>
                  <input
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-field">
                <label>Meeting Link (optional)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading && <Loader size={16} className="spin" />}
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="kuppi-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowLinkModal(null)}>
          <div className="kuppi-modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2>Add Meeting Link</h2>
              <button className="modal-close" onClick={() => setShowLinkModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="kuppi-form">
              <div className="info-box">
                <Info size={18} />
                <span>Applicants will be notified automatically when you add a meeting link.</span>
              </div>
              <div className="form-field">
                <label>Meeting Link</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetingLinkInput}
                  onChange={(e) => setMeetingLinkInput(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowLinkModal(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleAddLink(showLinkModal)}
                  disabled={!meetingLinkInput.trim()}
                >
                  <Video size={16} />
                  Save & Notify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applicants Modal */}
      {showApplicantsModal && (
        <ApplicantsModal
          postId={showApplicantsModal}
          posts={posts}
          onClose={() => setShowApplicantsModal(null)}
          onExport={handleExport}
        />
      )}
    </div>
  );
};


const SessionCard = ({ post, user, index, onApply, onAddLink, onViewApplicants, onExport, getStatusStyle, setMeetingLinkInput }) => {
  const isOwner = post.ownerId?._id === user?._id || post.ownerId === user?._id;
  const ownerName = post.ownerId?.name || "Unknown";
  const eventDate = new Date(post.eventDate);
  const isPast = eventDate < new Date();
  const status = getStatusStyle(post.status);

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const timeLeft = () => {
    const diff = eventDate - new Date();
    if (diff < 0) return "Ended";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return "Soon";
  };

  return (
    <div className="session-card" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="card-glow" />

      <div className="card-header">
        <div className="card-author">
          <div className="author-avatar" title={ownerName}>
            {post.ownerId?.profilePicture ? (
              <img src={post.ownerId.profilePicture} alt={ownerName} />
            ) : (
              ownerName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="author-info">
            <span className="author-name">{ownerName}</span>
            <span className="author-dept">{post.ownerId?.department || "Student"}</span>
          </div>
        </div>
        <span className="status-badge" style={{ background: status.bg, color: status.text }}>
          {post.status || "Pending"}
        </span>
      </div>

      <div className="card-body">
        <h3 className="card-title">{post.title}</h3>
        <p className="card-desc">{post.description}</p>
      </div>

      <div className="card-meta">
        <div className="meta-item">
          <Calendar size={16} />
          <span>{formatDate(eventDate)}</span>
        </div>
        <div className="meta-item">
          <BookOpen size={16} />
          <span>{post.subject || "General"}</span>
        </div>
        <div className="meta-item time-left">
          <Clock size={16} />
          <span>{timeLeft()}</span>
        </div>
        <div className="meta-item">
          <Users size={16} />
          <span>{post.applicantsCount || 0} Joined</span>
        </div>
      </div>

      {post.meetingLink && (
        <a
          href={post.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="meeting-btn"
        >
          <Video size={18} />
          Join Meeting
          <ExternalLink size={14} />
        </a>
      )}

      {!isOwner && !isPast && !post._hasApplied && (
        <button className="action-btn primary" onClick={() => onApply(post._id)}>
          <CheckCircle size={16} />
          Join Session
        </button>
      )}

      {post._hasApplied && !isOwner && (
        <div className="joined-badge">
          <CheckCircle size={14} />
          Successfully Joined
        </div>
      )}

      <div className="card-actions">
        {isOwner && (
          <>
            {!post.meetingLink && (
              <button
                className="action-btn"
                onClick={() => { onAddLink(post._id); setMeetingLinkInput(post.meetingLink || ""); }}
                title="Add Link"
              >
                <LinkIcon size={16} />
              </button>
            )}
            <button
              className="action-btn"
              onClick={() => onViewApplicants(post._id)}
              title="View Applicants"
            >
              <Users size={16} />
            </button>
            <button
              className="action-btn"
              onClick={() => onExport(post._id)}
              title="Export to Excel"
            >
              <FileSpreadsheet size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const ApplicantsModal = ({ postId, posts, onClose, onExport }) => {
  const { applicants, applicantsLoading } = useSelector((state) => state.kuppi);
  const postApplicants = applicants[postId] || [];
  const post = posts.find((p) => p._id === postId);

  return (
    <div className="kuppi-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="kuppi-modal" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <div>
            <h2>Session Applicants</h2>
            {post && <p className="modal-subtitle">{post.title}</p>}
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="applicants-header-bar">
          <span>{postApplicants.length} Applicant{postApplicants.length !== 1 ? "s" : ""}</span>
          <button className="btn-primary" onClick={() => onExport(postId)}>
            <FileSpreadsheet size={16} />
            Export Excel
          </button>
        </div>

        <div className="applicants-table">
          {applicantsLoading ? (
            <div className="kuppi-loading">
              <div className="spinner" />
              <span>Loading applicants...</span>
            </div>
          ) : postApplicants.length === 0 ? (
            <div className="no-applicants">
              <Users size={48} />
              <p>No applicants yet</p>
            </div>
          ) : (
            <>
              <div className="table-header">
                <span>#</span>
                <span>Name</span>
                <span>Email</span>
                <span>Department</span>
                <span>Applied</span>
              </div>
              {postApplicants.map((applicant, idx) => (
                <div className="table-row" key={applicant._id}>
                  <span className="row-num">{idx + 1}</span>
                  <span className="row-name">
                    <span className="row-avatar">
                      {applicant.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                    {applicant.name}
                  </span>
                  <span className="row-email">{applicant.email}</span>
                  <span className="row-dept">{applicant.applicantId?.department || "—"}</span>
                  <span className="row-date">
                    {new Date(applicant.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="kuppi-form">
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kuppi;
