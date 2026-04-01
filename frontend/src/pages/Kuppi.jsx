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
} from "lucide-react";
import { 
  Modal, 
  Button, 
  Form, 
  Grid, 
  Input, 
  TextArea, 
  Select, 
  Label, 
  Icon,
  Message 
} from "semantic-ui-react";
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
    e.preventDefault();
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
          <Button.Group basic size="large">
            <Button
              active={activeTab === "all"}
              onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
            >
              All Sessions
            </Button>
            <Button
              active={activeTab === "mine"}
              onClick={() => { setActiveTab("mine"); setCurrentPage(1); }}
            >
              My Sessions
            </Button>
          </Button.Group>
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
            <Grid columns={3} doubling stackable className="kuppi-grid">
              {filteredPosts.map((post, idx) => (
                <Grid.Column key={post._id}>
                  <SessionCard
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
                </Grid.Column>
              ))}
            </Grid>

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
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        size="small"
        className="kuppi-semantic-modal"
      >
        <Modal.Header>
          <div className="modal-header-flex">
            <span>Create New Session</span>
            <Icon name="close" onClick={() => setShowCreateModal(false)} link />
          </div>
        </Modal.Header>
        <Modal.Content>
          <Form onSubmit={handleCreatePost} Error={!!formError}>
            {formError && (
              <Message error content={formError} />
            )}
            <Form.Field required>
              <label>Title</label>
              <Input
                placeholder="e.g. Calculus Revision Session"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Form.Field>
            <Form.Field required>
              <label>Description</label>
              <TextArea
                placeholder="What will you cover in this session?"
                value={formData.description}
                onChange={(e, { value }) => setFormData({ ...formData, description: value })}
                rows={3}
              />
            </Form.Field>
            <Form.Group widths="equal">
              <Form.Field>
                <label>Subject</label>
                <Select
                  placeholder="Select Subject"
                  options={subjects.map(s => ({ key: s, text: s, value: s }))}
                  value={formData.subject}
                  onChange={(e, { value }) => setFormData({ ...formData, subject: value })}
                />
              </Form.Field>
              <Form.Field required>
                <label>Date & Time</label>
                <Input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                />
              </Form.Field>
            </Form.Group>
            <Form.Field>
              <label>Meeting Link (optional)</label>
              <Input
                icon="video"
                iconPosition="left"
                type="url"
                placeholder="https://meet.google.com/..."
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
              />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button secondary onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button 
            primary 
            loading={loading} 
            disabled={loading}
            onClick={handleCreatePost}
          >
            Create Session
          </Button>
        </Modal.Actions>
      </Modal>

      {/* Link Modal */}
      <Modal
        open={!!showLinkModal}
        onClose={() => setShowLinkModal(null)}
        size="mini"
      >
        <Modal.Header>Add Meeting Link</Modal.Header>
        <Modal.Content>
          <Message info icon>
            <Icon name="info circle" />
            <Message.Content>
              Applicants will be notified automatically
            </Message.Content>
          </Message>
          <Form>
            <Form.Field>
              <label>Meeting Link</label>
              <Input
                icon="linkify"
                iconPosition="left"
                type="url"
                placeholder="https://meet.google.com/..."
                value={meetingLinkInput}
                onChange={(e) => setMeetingLinkInput(e.target.value)}
              />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button basic onClick={() => setShowLinkModal(null)}>
            Cancel
          </Button>
          <Button
            primary
            onClick={() => handleAddLink(showLinkModal)}
            disabled={!meetingLinkInput.trim()}
          >
            <Icon name="video" />
            Save & Notify
          </Button>
        </Modal.Actions>
      </Modal>

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
        <Label style={{ background: status.bg, color: status.text }} size="small">
          {post.status || "Pending"}
        </Label>
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
        <Button 
          as="a" 
          href={post.meetingLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          fluid 
          color="blue"
          className="meeting-btn-semantic"
        >
          <Icon name="video" />
          Join Meeting
          <Icon name="external alternate" style={{ marginLeft: '8px' }} />
        </Button>
      )}

      {!isOwner && !isPast && !post._hasApplied && (
        <Button 
          fluid 
          primary 
          onClick={() => onApply(post._id)}
          className="meeting-btn-semantic"
        >
          <Icon name="check circle" />
          Join Session
        </Button>
      )}

      {post._hasApplied && !isOwner && (
        <Message success size="tiny" className="joined-message">
          <Icon name="check circle" />
          Successfully Joined
        </Message>
      )}

      <div className="card-actions">
        {isOwner && (
          <Button.Group widths={3} size="tiny" basic>
            {!post.meetingLink && (
              <Button 
                onClick={() => { onAddLink(post._id); setMeetingLinkInput(post.meetingLink || ""); }}
                title="Add Link"
              >
                <Icon name="linkify" />
              </Button>
            )}
            <Button 
              onClick={() => onViewApplicants(post._id)}
              title="View Applicants"
            >
              <Icon name="users" />
            </Button>
            <Button 
              onClick={() => onExport(post._id)}
              title="Export to Excel"
            >
              <Icon name="file excel" />
            </Button>
          </Button.Group>
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
    <Modal open onClose={onClose} size="large">
      <Modal.Header>
        <div className="modal-header-flex">
          <div>
            <Header as="h2">Session Applicants</Header>
            {post && <p style={{ fontSize: '0.9rem', color: 'var(--color-text-tertiary)', fontWeight: 'normal' }}>{post.title}</p>}
          </div>
          <Icon name="close" onClick={onClose} link />
        </div>
      </Modal.Header>
      <Modal.Content scrolling>
        <div className="applicants-header-bar-semantic">
          <Label color="blue" size="large">
            <Icon name="users" /> {postApplicants.length} Applicants
          </Label>
          <Button primary onClick={() => onExport(postId)}>
            <Icon name="file excel" /> Export Excel
          </Button>
        </div>

        {applicantsLoading ? (
          <div className="kuppi-loading-semantic">
            <Icon loading name="spinner" size="large" />
            <span>Loading applicants...</span>
          </div>
        ) : postApplicants.length === 0 ? (
          <div className="no-applicants-semantic">
            <Icon name="users" size="huge" disabled />
            <Header as="h3">No applicants yet</Header>
          </div>
        ) : (
          <Table celled padded striped className="applicants-table-semantic">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell width={1}>#</Table.HeaderCell>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Email</Table.HeaderCell>
                <Table.HeaderCell>Department</Table.HeaderCell>
                <Table.HeaderCell>Applied Date</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {postApplicants.map((applicant, idx) => (
                <Table.Row key={applicant._id}>
                  <Table.Cell>{idx + 1}</Table.Cell>
                  <Table.Cell>
                    <Header as="h4" image>
                      <div className="row-avatar-semantic">
                        {applicant.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <Header.Content>
                        {applicant.name}
                        <Header.Subheader>Student</Header.Subheader>
                      </Header.Content>
                    </Header>
                  </Table.Cell>
                  <Table.Cell>{applicant.email}</Table.Cell>
                  <Table.Cell>{applicant.applicantId?.department || "—"}</Table.Cell>
                  <Table.Cell>
                    {new Date(applicant.createdAt).toLocaleDateString("en-US", { 
                      month: "short", 
                      day: "numeric",
                      year: "numeric"
                    })}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose}>Close</Button>
      </Modal.Actions>
    </Modal>
  );
};

export default Kuppi;
