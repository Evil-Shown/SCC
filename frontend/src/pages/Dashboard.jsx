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
  Bell,
  Settings,
  User as UserIcon,
  Home as HomeIcon,
  BookMarked,
  Video,
  Target,
  Zap,
  TrendingUp,
  Activity,
  ChevronDown,
  Search,
  Plus
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState(3);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-dropdown')) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      dispatch(logout());
      navigate("/login");
    }
  };

  if (!user) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const dashboardModules = [
    {
      icon: <Brain size={28} />,
      title: "AI-Enhanced Timetable",
      description: "Generate personalized study schedules with AI analysis. Sync with Google Calendar.",
      features: ["AI Analysis", "Calendar Sync", "Custom Schedule"],
      status: "available",
      color: "#4f46e5",
      gradient: "linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)",
      path: "/timetable",
      badge: "AI Powered"
    },
    {
      icon: <BookMarked size={28} />,
      title: "Notes & Kuppi Platform",
      description: "Share notes via OneDrive, publish kuppi notices, engage with likes and comments.",
      features: ["OneDrive Links", "Kuppi Posts", "Engagement"],
      status: "available",
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      path: "/notes",
      badge: "Active"
    },
    {
      icon: <Users size={28} />,
      title: "Study Groups",
      description: "Create groups, add members, share admin messages, and participate in polls.",
      features: ["Group Chat", "Admin Messages", "Polls"],
      status: "available",
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      path: "/groups",
      badge: "Active"
    },
    {
      icon: <Target size={28} />,
      title: "Exam Mode",
      description: "Input exam timetables, prepare with AI tools, access NotebookLM.",
      features: ["Exam Schedule", "AI Prep", "NotebookLM"],
      status: "available",
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      path: "/exam-mode",
      badge: "New"
    },
    {
      icon: <Calendar size={28} />,
      title: "Calendar Integration",
      description: "Sync with Google Calendar, manage all academic events in one place.",
      features: ["Google Sync", "Event Management", "Reminders"],
      status: "available",
      color: "#ec4899",
      gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
      path: "/calendar",
      badge: null
    },
    {
      icon: <Share2 size={28} />,
      title: "File Sharing",
      description: "Share and access files securely within your campus community.",
      features: ["Upload", "Download", "Share"],
      status: "available",
      color: "#06b6d4",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
      path: "/files",
      badge: null
    }
  ];

  const quickStats = [
    {
      icon: <BookOpen size={20} />,
      label: "Shared Notes",
      value: "24",
      color: "#10b981",
      trend: "+12%"
    },
    {
      icon: <Users size={20} />,
      label: "Study Groups",
      value: "5",
      color: "#3b82f6",
      trend: "+2"
    },
    {
      icon: <Calendar size={20} />,
      label: "Upcoming Events",
      value: "8",
      color: "#f59e0b",
      trend: "Today"
    },
    {
      icon: <Target size={20} />,
      label: "Tasks Pending",
      value: "12",
      color: "#ef4444",
      trend: "3 due"
    }
  ];

  return (
    <div className="premium-dashboard">
      {/* Glass Navbar */}
      <nav className="dashboard-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <GraduationCap size={32} className="brand-icon" />
            <div className="brand-text">
              <span className="brand-name">Smart Campus</span>
              <span className="brand-tagline">Companion</span>
            </div>
          </div>

          <div className="navbar-links">
            <Link to="/dashboard" className="nav-item active">
              <HomeIcon size={18} />
              <span>Dashboard</span>
            </Link>
            <Link to="/timetable" className="nav-item">
              <Brain size={18} />
              <span>AI Timetable</span>
            </Link>
            <Link to="/notes" className="nav-item">
              <BookMarked size={18} />
              <span>Notes & Kuppi</span>
            </Link>
            <Link to="/groups" className="nav-item">
              <Users size={18} />
              <span>Study Groups</span>
            </Link>
            <Link to="/exam-mode" className="nav-item">
              <Target size={18} />
              <span>Exam Mode</span>
            </Link>
          </div>

          <div className="navbar-actions">
            <button className="icon-button" title="Search">
              <Search size={18} />
            </button>
            <button className="icon-button notification-btn" title="Notifications">
              <Bell size={18} />
              {notifications > 0 && <span className="notification-badge">{notifications}</span>}
            </button>
            <button className="icon-button" title="Settings">
              <Settings size={18} />
            </button>

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
                <ChevronDown size={14} className={`dropdown-icon ${showProfileMenu ? 'open' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <p className="dropdown-email">{user.email}</p>
                    {user.studentId && <p className="dropdown-id">ID: {user.studentId}</p>}
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item">
                    <UserIcon size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item danger">
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Hero */}
        <div className="dashboard-hero">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                {getGreeting()}, <span className="user-name-highlight">{user.name}</span>!
              </h1>
              <p className="hero-subtitle">
                Ready to make today productive? Here's your personalized dashboard.
              </p>
              <div className="user-details">
                <span className="detail-badge">
                  <GraduationCap size={14} />
                  {user.role}
                </span>
                {user.department && (
                  <span className="detail-badge">
                    <BookOpen size={14} />
                    {user.department}
                  </span>
                )}
                {user.year && (
                  <span className="detail-badge">
                    <Calendar size={14} />
                    Year {user.year}
                  </span>
                )}
                {user.studentId && (
                  <span className="detail-badge">
                    <FileText size={14} />
                    {user.studentId}
                  </span>
                )}
              </div>
            </div>
            <div className="hero-time">
              <div className="time-widget">
                <div className="current-time">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="current-date">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          {quickStats.map((stat, index) => (
            <div key={index} className="stat-card" style={{ animationDelay: `${index * 80}ms` }}>
              <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
              <div className="stat-trend" style={{ color: stat.color }}>
                <TrendingUp size={12} />
                {stat.trend}
              </div>
            </div>
          ))}
        </div>

        {/* Modules */}
        <div className="modules-section">
          <div className="section-header">
            <div>
              <h2>Your Modules</h2>
              <p className="section-description">Access all your campus tools and features</p>
            </div>
          </div>

          <div className="modules-grid">
            {dashboardModules.map((module, index) => (
              <Link
                key={index}
                to={module.path}
                className="module-card"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="module-header">
                  <div className="module-icon" style={{ background: module.gradient }}>
                    {module.icon}
                  </div>
                  {module.badge && (
                    <span className="module-badge" style={{ backgroundColor: module.color }}>
                      {module.badge}
                    </span>
                  )}
                </div>
                <h3 className="module-title">{module.title}</h3>
                <p className="module-description">{module.description}</p>
                <div className="module-features">
                  {module.features.map((feature, idx) => (
                    <span key={idx} className="feature-tag">
                      <Zap size={10} />
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="module-footer">
                  {module.status === 'available' ? (
                    <span className="module-status active">
                      <CheckCircle size={12} />
                      Available
                    </span>
                  ) : (
                    <span className="module-status coming-soon">
                      <Clock size={12} />
                      Coming Soon
                    </span>
                  )}
                  <ArrowRight size={16} className="module-arrow" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="activity-section">
          <div className="section-header">
            <h2>Ongoing Activities</h2>
            <button className="view-all-btn">
              View All
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="activity-grid">
            <div className="activity-card">
              <div className="activity-icon" style={{ background: '#e6f7e6', color: '#10b981' }}>
                <Activity size={20} />
              </div>
              <div className="activity-content">
                <h4>No ongoing events right now</h4>
                <p>Your upcoming events will appear here when they're happening</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-button primary">
            <Plus size={16} />
            <span>Add Timetable</span>
          </button>
          <button className="action-button">
            <BookMarked size={16} />
            <span>Share Notes</span>
          </button>
          <button className="action-button">
            <Video size={16} />
            <span>Create Kuppi</span>
          </button>
          <button className="action-button">
            <Users size={16} />
            <span>New Study Group</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;