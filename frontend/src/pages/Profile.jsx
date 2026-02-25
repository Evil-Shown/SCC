import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { logout, fetchUserProfile, updateUserProfile } from "../features/auth/authSlice";
import {
  Brain,
  BookMarked,
  Users,
  Calendar,
  GraduationCap,
  LogOut,
  Settings,
  User as UserIcon,
  Home as HomeIcon,
  Video,
  Activity,
  Shield,
  LayoutDashboard,
  Mail,
  MapPin,
  Github,
  Twitter,
  Linkedin,
  Edit3,
  Clock,
  Globe,
  Trash2,
  CheckCircle2,
  Archive,
  Sparkles,
  X,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import { useProfileAuroraBackground } from "../hooks/useProfileAuroraBackground";
import "../styles/Dashboard.css";
import "../styles/Notifications.css";
import "../styles/Profile.css";
import { deleteKuppiPost, getMyKuppiLogs } from "../services/kuppiService";
import { confirmAction, notifyError, notifySuccess } from "../utils/toast";

const TABS = ["overview", "activity", "settings"];

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [canvasReady, setCanvasReady] = useState(false);
  const canvasWrapRef = useRef(null);
  useProfileAuroraBackground(canvasWrapRef, canvasReady);

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
    github: "",
    twitter: "",
    linkedin: "",
  });

  const [kuppiLogs, setKuppiLogs] = useState([]);
  const [kuppiLogsLoading, setKuppiLogsLoading] = useState(false);
  const [kuppiLogsError, setKuppiLogsError] = useState("");

  const navLinks = [
    { icon: <HomeIcon size={15} />, label: "Home", path: "/" },
    { icon: <LayoutDashboard size={15} />, label: "Dashboard", path: "/dashboard" },
    { icon: <BookMarked size={15} />, label: "Notes", path: "/notes" },
    { icon: <Video size={15} />, label: "Kuppi", path: "/kuppi" },
    { icon: <Users size={15} />, label: "Groups", path: "/groups" },
    { icon: <UserIcon size={15} />, label: "Profile", path: "/profile" },
  ];

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    const tabFromQuery = searchParams.get("tab");
    if (tabFromQuery && TABS.includes(tabFromQuery) && tabFromQuery !== activeTab) {
      setActiveTab(tabFromQuery);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", activeTab);
    setSearchParams(next, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  useEffect(() => {
    const loadKuppiLogs = async () => {
      if (!isAuthenticated) return;

      setKuppiLogsLoading(true);
      setKuppiLogsError("");

      try {
        const response = await getMyKuppiLogs();
        setKuppiLogs(response.data || []);
      } catch (error) {
        setKuppiLogsError(error?.response?.data?.message || "Failed to load Kuppi logs");
      } finally {
        setKuppiLogsLoading(false);
      }
    };

    loadKuppiLogs();
  }, [isAuthenticated]);

  const summary = useMemo(() => {
    const total = kuppiLogs.length;
    const active = kuppiLogs.filter((log) => !log.isArchived).length;
    const archived = kuppiLogs.filter((log) => log.isArchived).length;
    const upcoming = kuppiLogs.filter((log) => {
      const eventDate = new Date(log.eventDate);
      return !Number.isNaN(eventDate.getTime()) && eventDate > new Date();
    }).length;

    return { total, active, archived, upcoming };
  }, [kuppiLogs]);

  const recentLogs = useMemo(() => {
    return [...kuppiLogs]
      .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
      .slice(0, 3);
  }, [kuppiLogs]);

  const handleDeleteKuppiLog = async (postId) => {
    const confirmed = await confirmAction(
      "Delete this Kuppi log? This will permanently remove it from the database.",
      { confirmText: "Delete" }
    );
    if (!confirmed) return;

    try {
      await deleteKuppiPost(postId);
      setKuppiLogs((prevLogs) => prevLogs.filter((log) => log._id !== postId));
      notifySuccess("Kuppi log deleted");
    } catch (error) {
      notifyError(error?.response?.data?.message || "Failed to delete Kuppi log");
    }
  };

  const openEditModal = () => {
    if (!user) return;

    setProfileSaveError("");
    setProfileForm({
      name: user.name || "",
      bio: user.bio || "",
      location: user.location || "",
      website: user.website || "",
      github: user.github || "",
      twitter: user.twitter || "",
      linkedin: user.linkedin || "",
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (isSavingProfile) return;
    setIsEditModalOpen(false);
    setProfileSaveError("");
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    try {
      setIsSavingProfile(true);
      setProfileSaveError("");

      await dispatch(updateUserProfile(profileForm)).unwrap();
      await dispatch(fetchUserProfile()).unwrap();

      setIsEditModalOpen(false);
      notifySuccess("Profile updated successfully");
    } catch (error) {
      setProfileSaveError(
        typeof error === "string" ? error : "Failed to save profile details"
      );
      notifyError(typeof error === "string" ? error : "Failed to save profile details");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirmAction("Sign out of Smart Campus?", {
      confirmText: "Sign out",
    });
    if (!confirmed) return;

    dispatch(logout());
    navigate("/login");
  };

  const formatTimelineDate = (date) => {
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return "Unknown date";

    return value.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const normalizeUrl = (value) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `https://${value}`;
  };

  const setCanvasWrapRef = (node) => {
    canvasWrapRef.current = node;
    setCanvasReady(Boolean(node));
  };

  if (!user || isLoading) {
    return (
      <div className="db-root profile-page">
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="db-root profile-page">
      <div className="db-canvas-wrap" ref={setCanvasWrapRef} />
      <div className="db-overlay-vignette" />

      <div className="db-layout">
        <nav className="db-nav">
          <div className="db-nav__inner">
            <Link to="/dashboard" className="db-brand">
              <div className="db-brand__mark">
                <GraduationCap size={18} color="#2a9d8f" />
              </div>
              <div>
                <div className="db-brand__name">Smart Campus</div>
                <div className="db-brand__sub">Companion</div>
              </div>
            </Link>

            <div className="db-nav__links">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`db-nav__link${link.path === "/profile" ? " db-nav__link--active" : ""}`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            <div className="db-nav__right">
              <NotificationBell />
            </div>
          </div>
        </nav>

        <main className="db-main profile-main">
          <section className="profile-hero card-surface">
            <div className="profile-hero__identity">
              <div className="profile-avatar-large">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} />
                ) : (
                  <span>{user.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div className="profile-hero__text">
                <p className="profile-kicker">My Profile</p>
                <h1 className="profile-name">{user.name}</h1>
                <p className="profile-headline">
                  {user.role || "Student"} • {user.department || "Department not set"}
                </p>

                <div className="profile-meta">
                  <span>
                    <Mail size={13} /> {user.email}
                  </span>
                  <span>
                    <MapPin size={13} /> {user.location || "Location not set"}
                  </span>
                  {user.studentId && (
                    <span>
                      <Shield size={13} /> ID: {user.studentId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-hero__actions">
              <button className="profile-edit-btn" onClick={openEditModal}>
                <Edit3 size={14} />
                <span>Edit Profile</span>
              </button>

              <div className="profile-social">
                {user.website && (
                  <a href={normalizeUrl(user.website)} target="_blank" rel="noopener noreferrer" className="social-link" title="Website">
                    <Globe size={16} />
                  </a>
                )}
                {user.github && (
                  <a href={normalizeUrl(user.github)} target="_blank" rel="noopener noreferrer" className="social-link" title="GitHub">
                    <Github size={16} />
                  </a>
                )}
                {user.twitter && (
                  <a href={normalizeUrl(user.twitter)} target="_blank" rel="noopener noreferrer" className="social-link" title="Twitter">
                    <Twitter size={16} />
                  </a>
                )}
                {user.linkedin && (
                  <a href={normalizeUrl(user.linkedin)} target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn">
                    <Linkedin size={16} />
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className="profile-stats">
            <article className="profile-stat-card card-surface">
              <div className="profile-stat-icon profile-stat-icon--teal">
                <Video size={18} />
              </div>
              <div className="profile-stat-content">
                <span className="profile-stat-value">{summary.total}</span>
                <span className="profile-stat-label">Published Kuppi</span>
              </div>
            </article>

            <article className="profile-stat-card card-surface">
              <div className="profile-stat-icon profile-stat-icon--green">
                <CheckCircle2 size={18} />
              </div>
              <div className="profile-stat-content">
                <span className="profile-stat-value">{summary.active}</span>
                <span className="profile-stat-label">Active Sessions</span>
              </div>
            </article>

            <article className="profile-stat-card card-surface">
              <div className="profile-stat-icon profile-stat-icon--amber">
                <Archive size={18} />
              </div>
              <div className="profile-stat-content">
                <span className="profile-stat-value">{summary.archived}</span>
                <span className="profile-stat-label">Expired Sessions</span>
              </div>
            </article>

            <article className="profile-stat-card card-surface">
              <div className="profile-stat-icon profile-stat-icon--blue">
                <Sparkles size={18} />
              </div>
              <div className="profile-stat-content">
                <span className="profile-stat-value">{summary.upcoming}</span>
                <span className="profile-stat-label">Upcoming Events</span>
              </div>
            </article>
          </section>

          <section className="profile-tabs card-surface">
            <button
              className={`profile-tab ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <UserIcon size={14} /> Overview
            </button>
            <button
              className={`profile-tab ${activeTab === "activity" ? "active" : ""}`}
              onClick={() => setActiveTab("activity")}
            >
              <Activity size={14} /> Activity
            </button>
            <button
              className={`profile-tab ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <Settings size={14} /> Settings
            </button>
          </section>

          <section className="profile-panel card-surface">
            {activeTab === "overview" && (
              <div className="panel-grid">
                <article className="panel-card">
                  <h3>About</h3>
                  <p>{user.bio || "No bio added yet."}</p>
                  <div className="about-details">
                    <div>
                      <Calendar size={14} /> Member since {new Date(user.createdAt || Date.now()).getFullYear()}
                    </div>
                    <div>
                      <Video size={14} /> {summary.total} total sessions published
                    </div>
                    <div>
                      <Activity size={14} /> {summary.active} currently active
                    </div>
                  </div>
                </article>

                <article className="panel-card links-card">
                  <h3>Quick Access</h3>
                  <ul>
                    <li>
                      <Link to="/dashboard">
                        <LayoutDashboard size={14} /> Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link to="/notes">
                        <BookMarked size={14} /> Notes
                      </Link>
                    </li>
                    <li>
                      <Link to="/kuppi">
                        <Video size={14} /> Kuppi Sessions
                      </Link>
                    </li>
                    <li>
                      <Link to="/groups">
                        <Users size={14} /> Study Groups
                      </Link>
                    </li>
                  </ul>
                </article>

                <article className="panel-card">
                  <div className="card-header">
                    <h3>Recent Kuppi Logs</h3>
                    <button className="view-all" onClick={() => setActiveTab("activity")}>View all</button>
                  </div>

                  <ul className="activity-list">
                    {recentLogs.length === 0 && <li className="activity-empty">No recent Kuppi logs.</li>}
                    {recentLogs.map((log) => (
                      <li key={log._id} className="activity-item">
                        <span className="activity-icon">
                          <Video size={12} />
                        </span>
                        <div>
                          <div className="activity-desc">{log.title}</div>
                          <div className="activity-time">
                            <Clock size={10} /> {formatTimelineDate(log.createdAt)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="panel-card">
                  <h3>Focus Areas</h3>
                  <div className="badge-grid">
                    <span className="badge">
                      <Brain size={14} /> Smart Learning
                    </span>
                    <span className="badge">
                      <Users size={14} /> Team Collaboration
                    </span>
                    <span className="badge">
                      <BookMarked size={14} /> Knowledge Sharing
                    </span>
                  </div>
                </article>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="activity-panel">
                <h3>Published Kuppi Logs</h3>
                <div className="activity-timeline">
                  {kuppiLogsLoading && <p className="timeline-empty">Loading Kuppi logs...</p>}
                  {!kuppiLogsLoading && kuppiLogsError && <p className="timeline-empty">{kuppiLogsError}</p>}
                  {!kuppiLogsLoading && !kuppiLogsError && kuppiLogs.length === 0 && (
                    <p className="timeline-empty">No Kuppi logs yet.</p>
                  )}

                  {!kuppiLogsLoading &&
                    !kuppiLogsError &&
                    kuppiLogs.map((log) => (
                      <article key={log._id} className="timeline-item">
                        <div className="timeline-icon">
                          <Video size={14} />
                        </div>

                        <div className="timeline-content">
                          <p className="timeline-title">{log.title}</p>
                          <span className="timeline-time">
                            <Clock size={10} /> Published {formatTimelineDate(log.createdAt)}
                          </span>
                          <span className="timeline-time">
                            <Calendar size={10} /> Event {formatTimelineDate(log.eventDate)}
                          </span>
                          <span className={`timeline-status ${log.isArchived ? "archived" : "active"}`}>
                            {log.isArchived ? "Expired (auto-archived)" : "Active"}
                          </span>
                        </div>

                        <button
                          className="timeline-delete-btn"
                          onClick={() => handleDeleteKuppiLog(log._id)}
                          title="Delete log"
                        >
                          <Trash2 size={14} />
                        </button>
                      </article>
                    ))}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="settings-panel">
                <h3>Profile Settings</h3>
                <div className="settings-summary">
                  <p><strong>Name:</strong> {user.name || "Not set"}</p>
                  <p><strong>Location:</strong> {user.location || "Not set"}</p>
                  <p><strong>Bio:</strong> {user.bio || "Not set"}</p>
                  <p><strong>Website:</strong> {user.website || "Not set"}</p>
                  <p><strong>GitHub:</strong> {user.github || "Not set"}</p>
                  <p><strong>Twitter:</strong> {user.twitter || "Not set"}</p>
                  <p><strong>LinkedIn:</strong> {user.linkedin || "Not set"}</p>
                </div>
                <div className="settings-actions">
                  <button className="profile-edit-btn" onClick={openEditModal}>
                    <Edit3 size={14} /> Edit Details
                  </button>
                  <button className="profile-logout-btn" onClick={handleLogout}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {isEditModalOpen && (
        <div className="profile-modal-overlay" onClick={closeEditModal}>
          <div className="profile-modal" onClick={(event) => event.stopPropagation()}>
            <div className="profile-modal__header">
              <h3>Edit Profile</h3>
              <button className="profile-modal__close" onClick={closeEditModal}>
                <X size={16} />
              </button>
            </div>

            <form className="profile-modal__form" onSubmit={handleProfileSave}>
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  rows="3"
                  value={profileForm.bio}
                  onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(event) => setProfileForm({ ...profileForm, location: event.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="text"
                    value={profileForm.website}
                    onChange={(event) => setProfileForm({ ...profileForm, website: event.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>GitHub</label>
                  <input
                    type="text"
                    value={profileForm.github}
                    onChange={(event) => setProfileForm({ ...profileForm, github: event.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Twitter</label>
                  <input
                    type="text"
                    value={profileForm.twitter}
                    onChange={(event) => setProfileForm({ ...profileForm, twitter: event.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>LinkedIn</label>
                <input
                  type="text"
                  value={profileForm.linkedin}
                  onChange={(event) => setProfileForm({ ...profileForm, linkedin: event.target.value })}
                />
              </div>

              {profileSaveError && <p className="profile-modal__error">{profileSaveError}</p>}

              <div className="profile-modal__actions">
                <button type="button" className="btn-cancel" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={isSavingProfile}>
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
