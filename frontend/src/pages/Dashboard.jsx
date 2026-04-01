// Dashboard.jsx
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import { useTheme } from "../context/ThemeContext";
import {
  Brain, BookMarked, Users, Calendar, Share2, GraduationCap,
  LogOut, ArrowRight, Home as HomeIcon,
  Video, Target, TrendingUp, Plus,
  Sparkles, ChevronRight, BookOpen, Activity,
  LayoutDashboard, Zap, Clock, Award,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import { confirmAction } from "../utils/toast";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [ringOffset, setRingOffset] = useState(0);
  const canvasRef = useRef(null);
  const [stats, setStats] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingEvent, setUpcomingEvent] = useState(null);
  const [animatedStats, setAnimatedStats] = useState([0, 0]);

  // Real-time progress ring effect
  useEffect(() => {
    const updateRing = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const totalSeconds = minutes * 60 + seconds;
      const circumference = 2 * Math.PI * 48;
      const offset = circumference * (1 - totalSeconds / 3600);
      setRingOffset(offset);
    };
    updateRing();
    const interval = setInterval(updateRing, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  // Initialize navigation indicator position
  useEffect(() => {
    const activeLink = document.querySelector('.dashboard-nav__link.active');
    if (activeLink) {
      const rect = activeLink.getBoundingClientRect();
      const parentRect = activeLink.parentElement.getBoundingClientRect();
      // setIndicatorStyle({
      //   left: rect.left - parentRect.left,
      //   width: rect.width,
      //   opacity: 1
      // });
    }
  }, [location]);

  // Task 7: Canvas particle system
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'dashboard-particles-canvas';
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const accentColors = [
      'rgba(16, 185, 129, 0.15)',   // Emerald
      'rgba(59, 130, 246, 0.15)',   // Azure
      'rgba(168, 85, 247, 0.15)',   // Amethyst
      'rgba(245, 158, 11, 0.15)',   // Amber
    ];

    const particles = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 1 + Math.random(),
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        color: accentColors[Math.floor(Math.random() * accentColors.length)],
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, []);

  // Fetch dashboard data from backend
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch notes count
        const notesRes = await axios.get("/api/notes");
        const notesCount = notesRes.data?.data?.length || 0;

        // Fetch groups count
        const groupsRes = await axios.get("/api/groups?myGroups=true");
        const groupsCount = groupsRes.data?.data?.length || 0;

        // Fetch all timetable events (not just ongoing)
        const allTimetableRes = await axios.get("/api/timetable");
        const allEvents = allTimetableRes.data?.data || [];

        // Find today's events
        const today = new Date();
        const todayEvents = allEvents.filter(ev => {
          const evDate = new Date(ev.start);
          return evDate.toDateString() === today.toDateString();
        });

        // Find upcoming event (next event after now)
        const nowTime = new Date();
        const futureEvents = allEvents.filter(ev => new Date(ev.start) > nowTime);
        futureEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
        setUpcomingEvent(futureEvents.length > 0 ? futureEvents[0] : null);

        // Fetch active tasks (for demo, use events count)
        const tasksCount = todayEvents.length;

        // Optionally, fetch recent activity (notes, groups, kuppi, etc.)
        const activity = [];
        if (notesRes.data?.data?.length > 0) {
          activity.push({ type: "note", text: `Shared a note: ${notesRes.data.data[0].title || "Untitled"}`, time: "Just now" });
        }
        if (groupsRes.data?.data?.length > 0) {
          activity.push({ type: "group", text: `Joined group: ${groupsRes.data.data[0].name || "Unnamed"}`, time: "Today" });
        }

        setStats([
          { icon: <BookOpen size={20} />, value: notesCount, label: "Notes Shared", trend: "", color: "#10b981", rgb: "16, 185, 129" },
          { icon: <Users size={20} />, value: groupsCount, label: "Study Groups", trend: "", color: "#3b82f6", rgb: "59, 130, 246" },
          { icon: <Calendar size={20} />, value: todayEvents.length, label: "Events Today", trend: "", color: "#8b5cf6", rgb: "139, 92, 246" },
          { icon: <Target size={20} />, value: tasksCount, label: "Active Tasks", trend: "", color: "#f59e0b", rgb: "245, 158, 11" },
        ]);
        setTodayClasses(todayEvents);
        setRecentActivity(activity);
      } catch (err) {
        // fallback to zeros
        setStats([
          { icon: <BookOpen size={20} />, value: 0, label: "Notes Shared", trend: "", color: "#10b981", rgb: "16, 185, 129" },
          { icon: <Users size={20} />, value: 0, label: "Study Groups", trend: "", color: "#3b82f6", rgb: "59, 130, 246" },
          { icon: <Calendar size={20} />, value: 0, label: "Events Today", trend: "", color: "#8b5cf6", rgb: "139, 92, 246" },
          { icon: <Target size={20} />, value: 0, label: "Active Tasks", trend: "", color: "#f59e0b", rgb: "245, 158, 11" },
        ]);
        setTodayClasses([]);
        setRecentActivity([]);
        setUpcomingEvent(null);
      }
    }
    fetchDashboardData();
  }, []);

  // Upcoming Event component
  const UpcomingEvent = () => (
    <div className="upcoming-event">
      {upcomingEvent ? (
        <>
          <div className="upcoming-event-title">{upcomingEvent.title || upcomingEvent.name || "Event"}</div>
          <div className="upcoming-event-time">
            {upcomingEvent.start ? new Date(upcomingEvent.start).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ""}
          </div>
          {upcomingEvent.location && <div className="upcoming-event-location">{upcomingEvent.location}</div>}
        </>
      ) : (
        <div className="upcoming-event-none">No upcoming events</div>
      )}
    </div>
  );

  const handleLogout = async () => {
    const confirmed = await confirmAction("Are you sure you want to log out?", {
      confirmText: "Log out",
    });
    if (!confirmed) return;
    dispatch(logout());
    navigate("/");
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
  };

  if (!user) {
    return (
      <div className="dashboard-loading" data-theme={theme}>
        Loading...
      </div>
    );
  }

  // Core modules – primary tools
  const primaryModules = [
    {
      icon: <Brain size={28} />,
      title: "AI Timetable",
      desc: "Generate adaptive weekly plans, avoid clashes, and sync with deadlines.",
      color: "#10b981", // Emerald
      path: "/timetable",
      badge: "AI Powered",
    },
    {
      icon: <BookMarked size={28} />,
      title: "Notes & Kuppi",
      desc: "Organise personal notes, share resources, and run peer sessions.",
      color: "#3b82f6", // Azure
      path: "/notes",
      badge: "Collaborative",
    },
    {
      icon: <Users size={28} />,
      title: "Study Groups",
      desc: "Chat, share files, and coordinate tasks with your group members.",
      color: "#a855f7", // Amethyst
      path: "/groups",
      badge: "Active",
    },
  ];

  // Secondary tools – compact cards
  const secondaryModules = [
    { icon: <Target size={18} />, title: "Exam Mode", desc: "Focused preparation plans", color: "#f97316", path: "/exam-mode" },
    { icon: <Calendar size={18} />, title: "Calendar", desc: "Events and study deadlines", color: "#06b6d4", path: "/calendar" },
    { icon: <Share2 size={18} />, title: "File Share", desc: "Fast resource sharing", color: "#10b981", path: "/files" },
  ];

  // Quick actions
  const quickActions = [
    { icon: <Plus size={16} />, label: "New Timetable", path: "/timetable", primary: true },
    { icon: <Video size={16} />, label: "Create Kuppi", path: "/kuppi" },
    { icon: <Users size={16} />, label: "New Group", path: "/groups" },
    { icon: <Share2 size={16} />, label: "Share Notes", path: "/notes" },
  ];

  // Task 5: TodayClasses static component
  // Dynamic TodayClasses
  const TodayClasses = () => (
    <div className="today-classes">
      {todayClasses.length === 0 ? (
        <div className="today-class-row">
          <span className="today-class-name">No classes today</span>
        </div>
      ) : (
        todayClasses.map((event, idx) => (
          <div className="today-class-row" key={idx}>
            <span className={`today-class-dot emerald`}></span>
            <span className="today-class-name">{event.title || event.name || "Class"}</span>
            <span className="today-class-time">{event.start ? new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
          </div>
        ))
      )}
    </div>
  );

  // Task 5: RecentActivity static component
  // Dynamic RecentActivity
  const RecentActivity = () => (
    <div className="recent-activity">
      {recentActivity.length === 0 ? (
        <div className="activity-row">
          <span className="activity-text">No recent activity</span>
        </div>
      ) : (
        recentActivity.map((act, idx) => (
          <div className="activity-row" key={idx}>
            <span className={`activity-dot ${act.type === "note" ? "azure" : act.type === "group" ? "amethyst" : "amber"}`}></span>
            <span className="activity-text">{act.text}</span>
            <span className="activity-time">{act.time}</span>
          </div>
        ))
      )}
    </div>
  );

  // Nav links - dynamic active state based on location
  const navLinks = [
    { icon: <HomeIcon size={20} strokeWidth={2.5} />, label: "Home", path: "/" },
    { icon: <LayoutDashboard size={20} strokeWidth={2.5} />, label: "Dashboard", path: "/dashboard" },
    { icon: <Brain size={20} strokeWidth={2.5} />, label: "Timetable", path: "/timetable" },
    { icon: <BookMarked size={20} strokeWidth={2.5} />, label: "Notes", path: "/notes" },
    { icon: <Video size={20} strokeWidth={2.5} />, label: "Kuppi", path: "/kuppi" },
    { icon: <Users size={20} strokeWidth={2.5} />, label: "Groups", path: "/groups" },
  ];

  return (
    <div className="dashboard" data-theme={theme}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          <Link to="/dashboard" className="dashboard-logo">
            <span className="dashboard-logo__text">User Dashboard</span>
          </Link>

          <nav className="dashboard-nav">
            {navLinks.map((link, idx) => (
              <Link
                key={link.path}
                to={link.path}
                className={`dashboard-nav__link ${location.pathname === link.path ? "active" : ""}`}
                style={{ "--i": idx }}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="dashboard-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <NotificationBell />
            <button className="dashboard-profile-btn" onClick={() => navigate("/profile")}>
              <span className="dashboard-avatar">
                {user.name?.charAt(0) || "U"}
              </span>
              <span className="dashboard-profile-name">{user.name?.split(" ")[0]}</span>
            </button>
            <button className="dashboard-logout-btn" onClick={handleLogout} aria-label="Log Out">
              <LogOut size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Hero Section */}
          <section className="dashboard-hero">
            <div>
              {/* Task 1: SYSTEM ONLINE status row */}
              <div className="dashboard-hero__system-status">
                <span className="dashboard-hero__system-dot"></span>
                <span className="dashboard-hero__system-text">SYSTEM ONLINE</span>
              </div>
              <div className="dashboard-hero__greeting">
                <span className="dashboard-hero__status-dot"></span>
                {getGreeting()}
              </div>
              <h1 className="dashboard-hero__name">{user.name}</h1>
              <div className="dashboard-hero__status">
                {animatedStats[0] || 0} notes · {animatedStats[1] || 0} groups · 7-day streak active
              </div>
              <p className="dashboard-hero__desc">
                Your study hub is ready. Track progress, access tools, and stay on top of your goals.
              </p>
              <div className="dashboard-hero__shortcuts">
                <button onClick={() => navigate("/timetable")}>Open Timetable</button>
                <button onClick={() => navigate("/notes")}>View Notes</button>
                <button onClick={() => navigate("/groups")}>Study Groups</button>
              </div>
            </div>

            {/* Clock Panel */}
            <div className="dashboard-time">
              <div className="dashboard-time__progress">
                <svg viewBox="0 0 100 100">
                  <circle className="progress-ring-bg" cx="50" cy="50" r="48" />
                  <circle
                    className="progress-ring"
                    cx="50"
                    cy="50"
                    r="48"
                    strokeDasharray={`${2 * Math.PI * 48}`}
                    strokeDashoffset={ringOffset}
                  />
                </svg>
              </div>
              <div className="dashboard-time__label">
                <Clock size={14} /> Current Time
              </div>
              <div className="dashboard-time__value">
                {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </div>
              <div className="dashboard-time__date">
                {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div>
          </section>

          {/* Stats Grid */}
          <div className="dashboard-stats">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="stat-card"
                style={{ "--accent": stat.color, "--accent-rgb": stat.rgb, "--i": idx + 5 }}
              >
                <div className="stat-card__icon">{stat.icon}</div>
                <div className="stat-card__content">
                  <div className="stat-card__value">{stat.value}</div>
                  <div className="stat-card__label">{stat.label}</div>
                </div>
                <div className="stat-card__trend">
                  <TrendingUp size={12} />
                  {stat.trend}
                </div>
              </div>
            ))}
          </div>

          {/* Two‑column layout */}
          <div className="dashboard-grid">
            {/* Left column: Modules */}
            <div className="dashboard-modules">
              {/* Primary modules */}
              <div className="section-header">
                <h2>Core Tools</h2>
                <span className="section-badge">{primaryModules.length} active</span>
              </div>
              <div className="primary-modules">
                {primaryModules.map((mod, idx) => (
                  <Link
                    key={idx}
                    to={mod.path}
                    className="primary-card"
                    style={{ "--color": mod.color, "--i": idx + 10 }}
                  >
                    <div className="primary-card__icon" style={{ backgroundColor: mod.color + "15", color: mod.color }}>
                      {mod.icon}
                    </div>
                    <div className="primary-card__content">
                      <div className="primary-card__title">
                        {mod.title}
                        {mod.badge && <span className="primary-card__badge">{mod.badge}</span>}
                      </div>
                      <p className="primary-card__desc">{mod.desc}</p>
                      <div className="primary-card__action">
                        <span>Explore Tool</span>
                        <span className="primary-card__arrow">→</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Secondary modules */}
              <div className="section-header" style={{ marginTop: "2rem" }}>
                <h2>More Tools</h2>
              </div>
              <div className="secondary-modules">
                {secondaryModules.map((mod, idx) => (
                  <Link
                    key={idx}
                    to={mod.path}
                    className="secondary-card"
                    style={{ "--color": mod.color, "--i": idx + 15 }}
                  >
                    <div className="secondary-card__icon" style={{ backgroundColor: mod.color + "15", color: mod.color }}>
                      {mod.icon}
                    </div>
                    <div className="secondary-card__info">
                      <div className="secondary-card__title">{mod.title}</div>
                      <div className="secondary-card__desc">{mod.desc}</div>
                    </div>
                    <ChevronRight size={16} className="secondary-card__arrow" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Right sidebar */}
            <aside className="dashboard-sidebar">
              {/* Quick Actions */}
              <div className="sidebar-card">
                <div className="sidebar-card__title">Quick Actions</div>
                <div className="quick-actions">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      className={`quick-action ${action.primary ? "primary" : ""}`}
                      onClick={() => navigate(action.path)}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>


              {/* Upcoming Event Section */}
              <div className="sidebar-card">
                <div className="sidebar-card__title">Upcoming Event</div>
                <UpcomingEvent />
              </div>

              {/* Task 5: Today's Classes */}
              <div className="sidebar-card">
                <div className="sidebar-card__title">Today's Classes</div>
                <TodayClasses />
              </div>

              {/* Task 5: Recent Activity */}
              <div className="sidebar-card">
                <div className="sidebar-card__title">Recent Activity</div>
                <RecentActivity />
              </div>

              {/* Optional: Study streak */}
              <div className="sidebar-card streak-card">
                <div className="streak-icon">
                  <Award size={24} />
                </div>
                <div>
                  <div className="streak-value">7 day streak</div>
                  <div className="streak-label">Keep it going! 🔥</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>

  );
}