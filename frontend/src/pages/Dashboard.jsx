import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import {
  BookOpen,
  FileText,
  Brain,
  Users,
  Calendar,
  Share2,
  GraduationCap,
  LogOut,
  ArrowRight,
  CheckCircle,
  Clock,
  Settings,
  User as UserIcon,
  Home as HomeIcon,
  BookMarked,
  Video,
  Target,
  Zap,
  TrendingUp,
  ChevronDown,
  Search,
  Plus,
  Sparkles,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import NotificationBell from "../components/NotificationBell";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showProfileMenu && !e.target.closest(".profile-dropdown"))
        setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      dispatch(logout());
      navigate("/login");
    }
  };

  if (!user) return <LoadingSpinner text="Loading your dashboard..." />;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  };

  /* ---- data ---- */
  const primaryModules = [
    {
      icon: <Brain size={26} />,
      title: "AI-Enhanced Timetable",
      desc: "Generate personalized study schedules with AI analysis & Google Calendar sync.",
      features: ["AI Analysis", "Calendar Sync", "Smart Schedule"],
      color: "#7c3aed",
      gradient: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
      path: "/timetable",
      badge: "AI Powered",
    },
    {
      icon: <BookMarked size={26} />,
      title: "Notes & Kuppi",
      desc: "Share notes via OneDrive, publish kuppi notices, react & comment.",
      features: ["OneDrive Links", "Kuppi Sessions", "Engagement"],
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      path: "/notes",
      badge: "Active",
    },
    {
      icon: <Users size={26} />,
      title: "Study Groups",
      desc: "Create study groups, share admin messages, chat, and participate in polls.",
      features: ["Group Chat", "Admin Messages", "Polls"],
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      path: "/groups",
      badge: "Active",
    },
  ];

  const secondaryModules = [
    {
      icon: <Target size={22} />,
      title: "Exam Mode",
      desc: "Exam timetables, AI preparation & NotebookLM.",
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      path: "/exam-mode",
      badge: "New",
    },
    {
      icon: <Calendar size={22} />,
      title: "Calendar",
      desc: "Google Calendar sync & event management.",
      color: "#ec4899",
      gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
      path: "/calendar",
      badge: null,
    },
    {
      icon: <Share2 size={22} />,
      title: "File Sharing",
      desc: "Share files securely within your campus.",
      color: "#06b6d4",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
      path: "/files",
      badge: null,
    },
  ];

  const quickStats = [
    { icon: <BookOpen size={18} />, label: "Shared Notes", value: "24", color: "#10b981", trend: "+12%" },
    { icon: <Users size={18} />, label: "Study Groups", value: "5", color: "#3b82f6", trend: "+2" },
    { icon: <Calendar size={18} />, label: "Events", value: "8", color: "#f59e0b", trend: "Today" },
    { icon: <Target size={18} />, label: "Tasks", value: "12", color: "#ef4444", trend: "3 due" },
  ];

  const quickActions = [
    { icon: <Plus size={15} />, label: "Add Timetable", path: "/timetable", primary: true },
    { icon: <BookMarked size={15} />, label: "Share Notes", path: "/notes" },
    { icon: <Video size={15} />, label: "Create Kuppi", path: "/kuppi" },
    { icon: <Users size={15} />, label: "New Group", path: "/groups" },
  ];

  return (
    <div className="premium-dashboard">
      {/* ──── Navbar ──── */}
      <nav className="dashboard-navbar">
        <div className="navbar-container">
          <Link to="/dashboard" className="navbar-brand">
            <GraduationCap size={30} className="brand-icon" />
            <div className="brand-text">
              <span className="brand-name">Smart Campus</span>
              <span className="brand-tagline">Companion</span>
            </div>
          </Link>

          <div className="navbar-links">
            <Link to="/dashboard" className="nav-item active">
              <HomeIcon size={16} />
              <span>Dashboard</span>
            </Link>
            <Link to="/timetable" className="nav-item">
              <Brain size={16} />
              <span>AI Timetable</span>
            </Link>
            <Link to="/notes" className="nav-item">
              <BookMarked size={16} />
              <span>Notes</span>
            </Link>
            <Link to="/kuppi" className="nav-item">
              <Video size={16} />
              <span>Kuppi</span>
            </Link>
            <Link to="/groups" className="nav-item">
              <Users size={16} />
              <span>Groups</span>
            </Link>
          </div>

          <div className="navbar-actions">
            <button className="icon-button" title="Search">
              <Search size={17} />
            </button>
            <NotificationBell />

            <div className="profile-dropdown">
              <button
                className="profile-button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="profile-avatar">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} />
                  ) : (
                    <span>{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="profile-info-nav">
                  <span className="profile-name">{user.name}</span>
                  <span className="profile-role">{user.role}</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`dropdown-icon ${showProfileMenu ? "open" : ""}`}
                />
              </button>

              {showProfileMenu && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <p className="dropdown-email">{user.email}</p>
                    {user.studentId && (
                      <p className="dropdown-id">ID: {user.studentId}</p>
                    )}
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/profile" className="dropdown-item">
                    <UserIcon size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <div className="dropdown-divider" />
                  <button
                    onClick={handleLogout}
                    className="dropdown-item danger"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ──── Main ──── */}
      <div className="dashboard-main">
        {/* ─── Hero Row ─── */}
        <section className="dash-hero">
          <div className="dash-hero__left">
            <p className="dash-hero__greeting">{getGreeting()},</p>
            <h1 className="dash-hero__name">{user.name}</h1>
            <p className="dash-hero__subtitle">
              Here's what's happening across your campus tools today.
            </p>
            <div className="dash-hero__badges">
              <span className="detail-badge">
                <GraduationCap size={13} />
                {user.role}
              </span>
              {user.department && (
                <span className="detail-badge">
                  <BookOpen size={13} />
                  {user.department}
                </span>
              )}
              {user.year && (
                <span className="detail-badge">
                  <Calendar size={13} />
                  Year {user.year}
                </span>
              )}
              {user.studentId && (
                <span className="detail-badge">
                  <FileText size={13} />
                  {user.studentId}
                </span>
              )}
            </div>
          </div>
          <div className="dash-hero__right">
            <div className="dash-hero__clock">
              <span className="clock-time">
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="clock-date">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </section>

        {/* ─── Stats Strip ─── */}
        <section className="dash-stats">
          {quickStats.map((s, i) => (
            <div
              key={i}
              className="dash-stat"
              style={{ "--accent": s.color, animationDelay: `${i * 60}ms` }}
            >
              <div className="dash-stat__icon">{s.icon}</div>
              <div className="dash-stat__body">
                <span className="dash-stat__value">{s.value}</span>
                <span className="dash-stat__label">{s.label}</span>
              </div>
              <span className="dash-stat__trend">
                <TrendingUp size={11} />
                {s.trend}
              </span>
            </div>
          ))}
        </section>

        {/* ─── Two-Column Layout ─── */}
        <div className="dash-grid">
          {/* Left — Modules */}
          <div className="dash-grid__main">
            {/* Primary Modules */}
            <div className="dash-section">
              <div className="dash-section__head">
                <div className="dash-section__title-group">
                  <LayoutGrid size={18} />
                  <h2>Your Modules</h2>
                </div>
                <p className="dash-section__sub">
                  Access all your campus tools
                </p>
              </div>

              <div className="primary-modules">
                {primaryModules.map((m, i) => (
                  <Link
                    key={i}
                    to={m.path}
                    className="module-card module-card--primary"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <div className="module-card__top">
                      <div
                        className="module-card__icon"
                        style={{ background: m.gradient }}
                      >
                        {m.icon}
                      </div>
                      {m.badge && (
                        <span
                          className="module-card__badge"
                          style={{ "--badge-color": m.color }}
                        >
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="module-card__title">{m.title}</h3>
                    <p className="module-card__desc">{m.desc}</p>
                    <div className="module-card__tags">
                      {m.features.map((f, fi) => (
                        <span key={fi} className="module-tag">
                          <Zap size={9} />
                          {f}
                        </span>
                      ))}
                    </div>
                    <div className="module-card__foot">
                      <span className="module-card__status">
                        <CheckCircle size={12} />
                        Available
                      </span>
                      <ArrowRight size={15} className="module-card__arrow" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Secondary Modules */}
            <div className="secondary-modules">
              {secondaryModules.map((m, i) => (
                <Link
                  key={i}
                  to={m.path}
                  className="module-card module-card--secondary"
                  style={{ animationDelay: `${(i + 3) * 70}ms` }}
                >
                  <div
                    className="module-mini-icon"
                    style={{ background: m.gradient }}
                  >
                    {m.icon}
                  </div>
                  <div className="module-mini-body">
                    <div className="module-mini-head">
                      <h4>{m.title}</h4>
                      {m.badge && (
                        <span
                          className="module-card__badge module-card__badge--sm"
                          style={{ "--badge-color": m.color }}
                        >
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <p>{m.desc}</p>
                  </div>
                  <ChevronRight size={16} className="module-card__arrow" />
                </Link>
              ))}
            </div>
          </div>

          {/* Right — Sidebar */}
          <aside className="dash-grid__side">
            {/* Quick Actions */}
            <div className="side-card">
              <h3 className="side-card__title">
                <Sparkles size={16} />
                Quick Actions
              </h3>
              <div className="quick-actions-list">
                {quickActions.map((a, i) => (
                  <button
                    key={i}
                    className={`qa-btn ${a.primary ? "qa-btn--primary" : ""}`}
                    onClick={() => navigate(a.path)}
                  >
                    {a.icon}
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming */}
            <div className="side-card">
              <h3 className="side-card__title">
                <Clock size={16} />
                Upcoming
              </h3>
              <div className="upcoming-empty">
                <Calendar size={28} strokeWidth={1.2} />
                <p>No upcoming events</p>
                <span>Your next events will appear here</span>
              </div>
            </div>

            {/* Activity Feed placeholder */}
            <div className="side-card">
              <div className="side-card__head-row">
                <h3 className="side-card__title">
                  <TrendingUp size={16} />
                  Activity
                </h3>
                <Link to="/notifications" className="side-card__link">
                  View all <ChevronRight size={13} />
                </Link>
              </div>
              <div className="upcoming-empty">
                <Sparkles size={28} strokeWidth={1.2} />
                <p>All caught up!</p>
                <span>Recent activity shows here</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;