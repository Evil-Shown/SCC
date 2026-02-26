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
  User,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  BookOpen,
} from "lucide-react";
import {
  fetchKuppiPosts,
  createKuppiAction,
  applyToKuppiAction,
  addMeetingLinkAction,
  fetchApplicantsAction,
} from "../features/kuppi/kuppiSlice";
import { exportApplicants } from "../services/kuppiService";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import { notifyError, notifySuccess } from "../utils/toast";
import "../styles/Kuppi.css";

const Kuppi = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { posts, loading, error, pagination } = useSelector(
    (state) => state.kuppi
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(null);
  const [showApplicantsModal, setShowApplicantsModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all"); // all | mine

  // Create form
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    eventDate: "",
    meetingLink: "",
  });
  const [formError, setFormError] = useState("");

  // Link form
  const [meetingLinkInput, setMeetingLinkInput] = useState("");

  const loadPosts = useCallback(() => {
    const params = { page: currentPage, limit: 10 };
    if (activeTab === "mine" && user?._id) {
      params.ownerId = user._id;
    }
    dispatch(fetchKuppiPosts(params));
  }, [dispatch, currentPage, activeTab, user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim() || !formData.description.trim() || !formData.eventDate) {
      setFormError("Title, description, and event date are required");
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
      notifySuccess("Kuppi post created successfully!");
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
    const result = await dispatch(
      addMeetingLinkAction({ postId, meetingLink: meetingLinkInput.trim() })
    );
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
      console.error("Export failed:", err);
      notifyError("Failed to export applicants");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled": return "status-scheduled";
      case "completed": return "status-completed";
      case "cancelled": return "status-cancelled";
      default: return "status-pending";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "scheduled": return "Scheduled";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      default: return "Pending";
    }
  };

  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Biology",
    "Computer Science", "Engineering", "Business", "Economics",
    "English", "History",
  ];

  return (
    <div className="kuppi-page">
      {/* Header */}
      <header className="kuppi-header">
        <div className="kuppi-header-left">
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Kuppi Sessions</h1>
            <p>Create and join peer tutoring sessions</p>
          </div>
        </div>
        <div className="kuppi-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            <span>Create Kuppi</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="kuppi-tabs">
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
        >
          All Sessions
        </button>
        <button
          className={`tab-btn ${activeTab === "mine" ? "active" : ""}`}
          onClick={() => { setActiveTab("mine"); setCurrentPage(1); }}
        >
          My Sessions
        </button>
      </div>

      {/* Error */}
      {error && <ErrorMessage message={error} onRetry={loadPosts} />}

      {/* Loading */}
      {loading && <LoadingSpinner text="Loading kuppi sessions..." />}

      {/* Posts */}
      {!loading && posts.length === 0 && (
        <EmptyState
          icon="🎓"
          title="No kuppi sessions"
          description={
            activeTab === "mine"
              ? "You haven't created any kuppi sessions yet"
              : "No kuppi sessions available. Create one!"
          }
          action={() => setShowCreateModal(true)}
          actionText="Create Kuppi"
        />
      )}

      {!loading && posts.length > 0 && (
        <>
          <div className="kuppi-list">
            {posts.map((post) => (
              <KuppiCard
                key={post._id}
                post={post}
                currentUserId={user?._id}
                onApply={handleApply}
                onAddLink={(postId) => {
                  setShowLinkModal(postId);
                  setMeetingLinkInput(post.meetingLink || "");
                }}
                onViewApplicants={handleViewApplicants}
                onExport={handleExport}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="kuppi-pagination">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span>Page {currentPage} of {pagination.pages}</span>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content uiverse-glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Kuppi Session</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="kuppi-form">
              {formError && <div className="form-error">{formError}</div>}
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures Revision Session"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={200}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  placeholder="Describe what will be covered in this session..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  >
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Event Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Meeting Link (optional — add later)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/... or https://zoom.us/..."
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Creating..." : "Create Kuppi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Meeting Link Modal */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(null)}>
          <div className="modal-content uiverse-glass modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Meeting Link</h2>
              <button className="modal-close" onClick={() => setShowLinkModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="link-form">
              <p className="link-form-info">
                <AlertCircle size={16} />
                All applicants will be notified via email and in-app notification.
              </p>
              <div className="form-group">
                <label>Meeting Link</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetingLinkInput}
                  onChange={(e) => setMeetingLinkInput(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowLinkModal(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
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

// Kuppi Card Component
const KuppiCard = ({
  post,
  currentUserId,
  onApply,
  onAddLink,
  onViewApplicants,
  onExport,
  getStatusColor,
  getStatusLabel,
}) => {
  const isOwner = post.ownerId?._id === currentUserId || post.ownerId === currentUserId;
  const ownerName = post.ownerId?.name || "Unknown";
  const ownerDept = post.ownerId?.department || "";
  const eventDate = new Date(post.eventDate);
  const isPast = eventDate < new Date();
  const dateStr = eventDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`kuppi-card card-shine hover-glow fade-in ${isPast ? "past" : ""}`}>
      <div className="kuppi-card-top">
        <div className="kuppi-card-info">
          <div className="kuppi-author">
            <div className="kuppi-avatar">
              {post.ownerId?.profilePicture ? (
                <img src={post.ownerId.profilePicture} alt={ownerName} />
              ) : (
                <span>{ownerName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <span className="kuppi-author-name">{ownerName}</span>
              {ownerDept && <span className="kuppi-meta">{ownerDept}</span>}
            </div>
          </div>
          <span className={`kuppi-status ${getStatusColor(post.status)}`}>
            {getStatusLabel(post.status)}
          </span>
        </div>

        <h3 className="kuppi-title">{post.title}</h3>
        <p className="kuppi-description">{post.description}</p>

        <div className="kuppi-details">
          <span className="kuppi-detail">
            <Calendar size={15} /> {dateStr}
          </span>
          <span className="kuppi-detail">
            <Clock size={15} /> {timeStr}
          </span>
          {post.subject && (
            <span className="kuppi-detail">
              <BookOpen size={15} /> {post.subject}
            </span>
          )}
          <span className="kuppi-detail">
            <Users size={15} /> {post.applicantsCount || 0} applicants
          </span>
        </div>

        {post.meetingLink && (
          <a
            href={post.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="kuppi-meeting-link"
          >
            <Video size={16} />
            Join Meeting
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      <div className="kuppi-card-actions">
        {isOwner ? (
          <>
            {!post.meetingLink && (
              <button className="btn btn-sm btn-primary" onClick={() => onAddLink(post._id)}>
                <LinkIcon size={14} />
                Add Link
              </button>
            )}
            <button className="btn btn-sm btn-outline" onClick={() => onViewApplicants(post._id)}>
              <Users size={14} />
              Applicants ({post.applicantsCount || 0})
            </button>
            <button className="btn btn-sm btn-outline" onClick={() => onExport(post._id)}>
              <FileSpreadsheet size={14} />
              Export
            </button>
          </>
        ) : (
          <>
            {!isPast && !post._hasApplied && (
              <button className="btn btn-sm btn-primary" onClick={() => onApply(post._id)}>
                <CheckCircle size={14} />
                Apply
              </button>
            )}
            {post._hasApplied && (
              <span className="applied-badge">
                <CheckCircle size={14} /> Applied
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Applicants Modal
const ApplicantsModal = ({ postId, posts, onClose, onExport }) => {
  const { applicants, applicantsLoading } = useSelector((state) => state.kuppi);
  const postApplicants = applicants[postId] || [];
  const post = posts.find((p) => p._id === postId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content uiverse-glass modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Applicants</h2>
            {post && <p className="modal-subtitle">{post.title}</p>}
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="applicants-toolbar">
          <span className="applicant-count">{postApplicants.length} applicants</span>
          <button className="btn btn-sm btn-primary" onClick={() => onExport(postId)}>
            <Download size={14} />
            Export to Excel
          </button>
        </div>

        {applicantsLoading && <LoadingSpinner size="sm" text="Loading applicants..." />}

        {!applicantsLoading && postApplicants.length === 0 && (
          <div className="no-applicants">
            <Users size={32} />
            <p>No applicants yet</p>
          </div>
        )}

        {!applicantsLoading && postApplicants.length > 0 && (
          <div className="applicants-list">
            <div className="applicant-table-header">
              <span>#</span>
              <span>Name</span>
              <span>Email</span>
              <span>Department</span>
              <span>Applied</span>
            </div>
            {postApplicants.map((applicant, idx) => (
              <div key={applicant._id} className="applicant-row">
                <span className="applicant-num">{idx + 1}</span>
                <span className="applicant-name">
                  <div className="kuppi-avatar small">
                    <span>{applicant.name?.charAt(0)?.toUpperCase() || "U"}</span>
                  </div>
                  {applicant.name}
                </span>
                <span className="applicant-email">{applicant.email}</span>
                <span className="applicant-dept">
                  {applicant.applicantId?.department || "—"}
                </span>
                <span className="applicant-date">
                  {new Date(applicant.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Kuppi;
