// Dashboard.jsx - Advanced Edition
import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  Brain, BookMarked, Users, Calendar, Share2,
  ArrowRight,
  Video, Target, TrendingUp, Plus,
  ChevronRight, BookOpen, Clock, Award, Activity,
  Sparkles, Flame, BarChart3, CheckCircle2, Zap, MessageSquare,
  Mic, Coffee, Headphones, MapPin, CalendarDays,
  ListTodo, FileText, Globe, Github, Twitter, Linkedin, GraduationCap
} from "lucide-react";
import StudentDashboardShell from "../components/StudentDashboardShell";
import "../styles/Dashboard.css";

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 800 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const increment = value / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.1 }
    );
    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return <span ref={countRef}>{count}</span>;
};

// Simple Bar Chart Component
const StudyBarChart = () => {
  const data = [4, 6, 5, 7, 8, 5, 3]; // Mon-Sun study hours
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const maxHour = 10;

  return (
    <div className="bar-chart">
      {data.map((hour, i) => (
        <div key={i} className="bar-item">
          <div className="bar-label">{days[i]}</div>
          <div className="bar-container">
            <div
              className="bar-fill"
              style={{ height: `${(hour / maxHour) * 100}%` }}
            >
              <span className="bar-value">{hour}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [dayProgress, setDayProgress] = useState(0);
  const [stats, setStats] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingEvent, setUpcomingEvent] = useState(null);
  const [examOverview, setExamOverview] = useState(null);
  const [examTick, setExamTick] = useState(Date.now());
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(7);
  const [aiInsight, setAiInsight] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [quote, setQuote] = useState({ text: "The expert in anything was once a beginner.", author: "Helen Hayes" });

  // Day progress ring effect
  useEffect(() => {
    const updateDayProgress = () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const elapsed = now - startOfDay;
      const total = 24 * 60 * 60 * 1000;
      setDayProgress((elapsed / total) * 100);
    };
    updateDayProgress();
    const interval = setInterval(updateDayProgress, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setExamTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        const notesRes = await api.get("/api/notes");
        const notesCount = notesRes.data?.data?.length || 0;
        const recentNotesData = notesRes.data?.data?.slice(0, 3) || [];

        const groupsRes = await api.get("/api/groups", {
          params: { myGroups: true }
        });
        const groupsCount = groupsRes.data?.data?.length || 0;

        const allTimetableRes = await api.get("/api/timetable");
        const allEvents = allTimetableRes.data?.data || [];

        let overviewData = null;
        try {
          const examsRes = await api.get("/api/exams/overview");
          overviewData = examsRes.data?.data || null;
        } catch {
          overviewData = null;
        }
        setExamOverview(overviewData);

        const today = new Date();
        const todayEvents = allEvents.filter(ev => {
          const evDate = new Date(ev.start);
          return evDate.toDateString() === today.toDateString();
        });

        const nowTime = new Date();
        const futureEvents = allEvents.filter(ev => new Date(ev.start) > nowTime);
        futureEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
        setUpcomingEvent(futureEvents.length > 0 ? futureEvents[0] : null);

        // Get upcoming deadlines (next 5 events)
        setUpcomingDeadlines(futureEvents.slice(0, 5));

        // Generate recent activity
        const activity = [];
        if (notesRes.data?.data?.length > 0) {
          activity.push({
            type: "note",
            icon: <FileText size={14} />,
            text: `Created "${notesRes.data.data[0].title || "Untitled"}"`,
            time: "Just now"
          });
        }
        if (groupsRes.data?.data?.length > 0) {
          activity.push({
            type: "group",
            icon: <Users size={14} />,
            text: `Joined "${groupsRes.data.data[0].name}"`,
            time: "Today"
          });
        }
        if (todayEvents.length > 0) {
          activity.push({
            type: "event",
            icon: <Calendar size={14} />,
            text: `"${todayEvents[0].title}" starts in 2 hours`,
            time: "Today"
          });
        }

        setStats([
          { icon: <BookOpen size={20} />, value: notesCount, label: "Notes", trend: "+12%", color: "#00ffa3", bg: "rgba(0,255,163,0.1)" },
          { icon: <Users size={20} />, value: groupsCount, label: "Groups", trend: "+3", color: "#00e1ff", bg: "rgba(0,225,255,0.1)" },
          { icon: <Calendar size={20} />, value: todayEvents.length, label: "Today's Events", trend: "", color: "#ffb347", bg: "rgba(255,179,71,0.1)" },
          { icon: <Target size={20} />, value: 4, label: "Tasks Left", trend: "2 completed", color: "#ff6b6b", bg: "rgba(255,107,107,0.1)" },
        ]);
        setTodayClasses(todayEvents);
        setRecentActivity(activity);
        setRecentNotes(recentNotesData);

        // AI Insight
        const insights = [
          "You have 2h free this afternoon. Perfect for reviewing CS notes! 📚",
          "Your focus peaks at 10 AM. Schedule tough topics then. 🧠",
          "7-day streak! You're crushing it. Keep the momentum 🔥",
          "Group study for Math on Friday? Create a session now."
        ];
        setAiInsight(insights[Math.floor(Math.random() * insights.length)]);

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setStats([
          { icon: <BookOpen size={20} />, value: 0, label: "Notes", trend: "", color: "#00ffa3", bg: "rgba(0,255,163,0.1)" },
          { icon: <Users size={20} />, value: 0, label: "Groups", trend: "", color: "#00e1ff", bg: "rgba(0,225,255,0.1)" },
          { icon: <Calendar size={20} />, value: 0, label: "Today's Events", trend: "", color: "#ffb347", bg: "rgba(255,179,71,0.1)" },
          { icon: <Target size={20} />, value: 0, label: "Tasks Left", trend: "", color: "#ff6b6b", bg: "rgba(255,107,107,0.1)" },
        ]);
        setTodayClasses([]);
        setRecentActivity([]);
        setUpcomingEvent(null);
        setUpcomingDeadlines([]);
        setRecentNotes([]);
        setExamOverview(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
  };

  const nextExamCountdown = (() => {
    const target = examOverview?.nextExam?.examDate;
    if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const diff = Math.max(0, new Date(target).getTime() - examTick);
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  })();

  if (!user) {
    return (
      <div className="dashboard-loading" data-theme={theme}>
        <div className="loading-spinner"></div>
        <span>Loading your workspace...</span>
      </div>
    );
  }

  const primaryModules = [
    { icon: <Brain size={24} />, title: "AI Timetable", desc: "Smart scheduling & clash prevention", path: "/timetable", gradient: "linear-gradient(135deg, #00ffa3, #00e1ff)", badge: "Smart Planner", meta: ["Auto clash checks", "Adaptive scheduling"] },
    { icon: <BookMarked size={24} />, title: "Knowledge Hub", desc: "Notes, files & resources", path: "/notes", gradient: "linear-gradient(135deg, #00c853, #7cfc00)", badge: "Study Library", meta: ["Fast notes access", "Organized resources"] },
    { icon: <Users size={24} />, title: "Study Groups", desc: "Collaborate & learn together", path: "/groups", gradient: "linear-gradient(135deg, #10b981, #22c55e)", badge: "Team Space", meta: ["Live collaboration", "Shared learning"] },
    { icon: <GraduationCap size={24} />, title: "Exam Mode", desc: "Countdown, tracker, AI revision", path: "/exam-mode", gradient: "linear-gradient(135deg, #14b8a6, #22c55e)", badge: "Exam Ready", meta: ["Subject-wise progress", "Daily study roadmap"] },
  ];

  const quickActions = [
    { icon: <Plus size={16} />, label: "New Timetable", path: "/timetable", primary: true },
    { icon: <GraduationCap size={16} />, label: "Open Exam Mode", path: "/exam-mode" },
    { icon: <Video size={16} />, label: "Create Kuppi", path: "/kuppi" },
    { icon: <Users size={16} />, label: "New Group", path: "/groups" },
    { icon: <Share2 size={16} />, label: "Share Notes", path: "/notes" },
  ];

  return (
    <StudentDashboardShell focusMode={focusMode}>
      <main className="bento-container">
        <div className="bento-grid">

          {/* Welcome Hero Card - spans 7 columns now */}
          <div className="bento-card bento-hero">
            <div className="bento-badge">
              <Sparkles size={12} />
              <span>AI READY</span>
            </div>
            <h1 className="bento-hero__title">
              {getGreeting()}, {user.name?.split(" ")[0]}
            </h1>
            <p className="bento-hero__desc">
              Your AI-powered study hub. Track progress, manage tasks, and stay ahead.
            </p>
            <div className="bento-exam-mini">
              <div className="bento-exam-mini__head">
                <GraduationCap size={14} />
                <span>Exam Mode Snapshot</span>
              </div>
              {examOverview?.nextExam ? (
                <>
                  <div className="bento-exam-mini__subject">
                    {examOverview.nextExam.subjectCode} - {examOverview.nextExam.subjectName}
                  </div>
                  <div className="bento-exam-mini__countdown">
                    <span>{nextExamCountdown.days}d</span>
                    <span>{nextExamCountdown.hours}h</span>
                    <span>{nextExamCountdown.minutes}m</span>
                    <span>{nextExamCountdown.seconds}s</span>
                  </div>
                </>
              ) : (
                <div className="bento-exam-mini__empty">No upcoming exams yet.</div>
              )}
            </div>
            <div className="bento-hero__actions">
              <button className="bento-btn" onClick={() => navigate("/timetable")}>
                Launch Timetable <ArrowRight size={16} />
              </button>
              <button className="bento-btn" onClick={() => navigate("/exam-mode")}>
                Open Exam Mode <ArrowRight size={16} />
              </button>
              <button className="bento-btn bento-btn--ghost" onClick={() => setFocusMode(!focusMode)}>
                <Headphones size={16} /> Focus Mode
              </button>
            </div>
          </div>

          {/* Right side: Time + Streak combo (span 5) */}
          <div className="bento-card bento-time-combo">
            <div className="time-ring-section">
              <div className="dashboard-time__progress">
                <svg viewBox="0 0 100 100">
                  <circle className="progress-ring-bg" cx="50" cy="50" r="42" />
                  <circle
                    className="progress-ring"
                    cx="50"
                    cy="50"
                    r="42"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - dayProgress / 100)}`}
                  />
                </svg>
                <div className="progress-percentage">{Math.floor(dayProgress)}%</div>
              </div>
              <div className="time-info">
                <div className="clock-display">
                  {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </div>
                <div className="clock-date">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </div>
              </div>
            </div>
            <div className="streak-mini">
              <Flame size={20} color="#ff6b6b" />
              <span className="streak-number-mini">{streak}</span>
              <span className="streak-label-mini">day streak</span>
            </div>
          </div>

          {/* 4 Stats Cards */}
          {stats.map((stat, idx) => (
            <div key={idx} className="bento-card bento-stat" style={{ '--stat-bg': stat.bg }}>
              <div className="stat-icon" style={{ color: stat.color, background: stat.bg }}>
                {stat.icon}
              </div>
              <div className="stat-data">
                <div className="stat-data__value">
                  {isLoading ? <div className="skeleton skeleton-text"></div> : <AnimatedCounter value={stat.value} />}
                </div>
                <div className="stat-data__label">{stat.label}</div>
                {stat.trend && <div className="stat-data__trend">{stat.trend}</div>}
              </div>
            </div>
          ))}

          {/* Core Tools Section - 3 cards, span 7 */}
          <div className="bento-core-tools">
            {primaryModules.map((mod, idx) => (
              <Link key={idx} to={mod.path} className="bento-tool bento-tool--link" style={{ '--gradient': mod.gradient }}>
                <div className="tool-top">
                  <div className="tool-icon">{mod.icon}</div>
                  <span className="tool-badge">{mod.badge}</span>
                </div>
                <div className="tool-title">{mod.title}</div>
                <div className="tool-desc">{mod.desc}</div>
                <div className="tool-meta">
                  {mod.meta.map((item) => (
                    <span key={item} className="tool-meta__pill">{item}</span>
                  ))}
                </div>
                <span className="tool-link">
                  Open section <ChevronRight size={14} />
                </span>
              </Link>
            ))}
          </div>

          {/* Right Sidebar - Quick Actions + Upcoming + AI Insight (span 5) */}
          <div className="bento-card bento-sidebar">
            <div className="sidebar-section">
              <div className="section-label">
                <Zap size={12} />
                Quick Actions
              </div>
              <div className="quick-action-list">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    className={`bento-qa-btn ${action.primary ? 'primary' : ''}`}
                    onClick={() => navigate(action.path)}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                    <ChevronRight size={14} className="qa-arrow" />
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <div className="section-label">
                <CalendarDays size={12} />
                Upcoming Deadlines
              </div>
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.slice(0, 3).map((deadline, idx) => (
                  <div key={idx} className="deadline-item">
                    <div className="deadline-date">
                      {new Date(deadline.start).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="deadline-title">{deadline.title}</div>
                    <div className="deadline-time">
                      {new Date(deadline.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty">No upcoming deadlines</div>
              )}
            </div>

            <div className="sidebar-section ai-insight">
              <div className="section-label">
                <MessageSquare size={12} />
                AI Insight
              </div>
              <div className="insight-text">
                <Sparkles size={16} />
                <p>{aiInsight || "Loading insights..."}</p>
              </div>
            </div>
          </div>

          {/* Today's Schedule - Timeline View (span 6) */}
          <div className="bento-card bento-schedule">
            <div className="section-label">
              <Clock size={12} />
              Today's Schedule
            </div>
            <div className="timeline">
              {todayClasses.length > 0 ? (
                todayClasses.map((event, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-time">
                      {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="timeline-title">{event.title || "Class"}</div>
                      <div className="timeline-location">
                        {event.location || "Virtual"}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty">No classes scheduled today. Time to study independently!</div>
              )}
            </div>
          </div>

          {/* Study Hours Chart (span 6) */}
          <div className="bento-card bento-chart">
            <div className="section-label">
              <BarChart3 size={12} />
              Study Hours This Week
            </div>
            <StudyBarChart />
            <div className="chart-total">
              Total: 38 hours this week <TrendingUp size={14} className="trend-up" />
            </div>
          </div>

          {/* Recent Notes Preview (span 4) */}
          <div className="bento-card bento-recent-notes">
            <div className="section-label">
              <FileText size={12} />
              Recent Notes
            </div>
            {recentNotes.length > 0 ? (
              recentNotes.map((note, idx) => (
                <div key={idx} className="note-preview" onClick={() => navigate(`/notes/${note._id}`, { state: { from: "/dashboard" } })}>
                  <BookOpen size={14} />
                  <div className="note-info">
                    <div className="note-title">{note.title || "Untitled"}</div>
                    <div className="note-date">{new Date(note.createdAt).toLocaleDateString()}</div>
                  </div>
                  <ChevronRight size={14} className="note-arrow" />
                </div>
              ))
            ) : (
              <div className="empty">No notes yet. Create your first note!</div>
            )}
            <button className="create-note-btn" onClick={() => navigate("/notes")}>
              <Plus size={14} /> Create New Note
            </button>
          </div>

          {/* Recent Activity Feed (span 4) */}
          <div className="bento-card bento-activity-feed">
            <div className="section-label">
              <Activity size={12} />
              Recent Activity
            </div>
            <div className="activity-feed">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, idx) => (
                  <div key={idx} className="feed-item">
                    <div className="feed-icon">{activity.icon}</div>
                    <div className="feed-content">
                      <div className="feed-text">{activity.text}</div>
                      <div className="feed-time">{activity.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-feed">No recent activity</div>
              )}
            </div>
          </div>

          {/* Motivational Quote (span 4) */}
          <div className="bento-card bento-quote">
            <div className="quote-icon">“</div>
            <div className="quote-text">{quote.text}</div>
            <div className="quote-author">— {quote.author}</div>
            <div className="quote-refresh" onClick={() => {
              // Could fetch from API, just rotate through local quotes
              const quotes = [
                { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
                { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
                { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
                { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" }
              ];
              const newQuote = quotes[Math.floor(Math.random() * quotes.length)];
              setQuote(newQuote);
            }}>
              <Sparkles size={12} />
            </div>
          </div>

        </div>
      </main>
    </StudentDashboardShell>
  );
}