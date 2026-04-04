import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Bell, CheckCheck, ArrowLeft, MessageSquare, ThumbsUp,
  Video, Info, Calendar, Users, Check, ExternalLink,
  Zap, CheckCircle2, XCircle, Award, Filter, Eye, EyeOff,
  Sparkles, Clock, TrendingUp, Star
} from "lucide-react";
import {
  fetchNotifications,
  markAsReadAction,
  markAllAsReadAction,
} from "../features/notifications/notificationsSlice";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import "../styles/Notifications.css";

// Enhanced notification config with gradients and labels
const NOTIF_CONFIG = {
  note_reaction: { icon: ThumbsUp, gradient: "reaction-gradient", label: "Reaction", glow: "reaction-glow" },
  note_comment: { icon: MessageSquare, gradient: "comment-gradient", label: "Comment", glow: "comment-glow" },
  kuppi_scheduled: { icon: Video, gradient: "kuppi-gradient", label: "Kuppi", glow: "kuppi-glow" },
  general: { icon: Users, gradient: "general-gradient", label: "General", glow: "general-glow" },
  group_meetup_created: { icon: Calendar, gradient: "meetup-gradient", label: "Meetup Created", glow: "meetup-glow" },
  group_meetup_activated: { icon: Zap, gradient: "meetup-gradient", label: "Voting Open", glow: "meetup-glow" },
  group_meetup_confirmed: { icon: CheckCircle2, gradient: "confirmed-gradient", label: "Confirmed", glow: "confirmed-glow" },
  group_meetup_cancelled: { icon: XCircle, gradient: "cancelled-gradient", label: "Cancelled", glow: "cancelled-glow" },
  group_meetup_completed: { icon: Award, gradient: "completed-gradient", label: "Completed", glow: "completed-glow" },
  group_meetup_vote: { icon: CheckCheck, gradient: "vote-gradient", label: "Vote", glow: "vote-glow" },
};

const getConfig = (type) => NOTIF_CONFIG[type] || { icon: Info, gradient: "general-gradient", label: "Notification", glow: "general-glow" };

// Helper to group notifications by relative date
const groupNotificationsByDate = (notifications) => {
  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  };
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 7);

  notifications.forEach(notif => {
    const date = new Date(notif.createdAt);
    if (date >= todayStart) groups.today.push(notif);
    else if (date >= yesterdayStart) groups.yesterday.push(notif);
    else if (date >= weekAgo) groups.thisWeek.push(notif);
    else groups.older.push(notif);
  });

  return groups;
};

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, pagination } = useSelector(
    (state) => state.notifications
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all"); // 'all', 'unread'
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications({ page: currentPage, limit: 20 }));
  }, [dispatch, currentPage]);

  const handleMarkRead = (id) => dispatch(markAsReadAction(id));
  const handleMarkAllRead = () => dispatch(markAllAsReadAction());

  const handleNotifNavigate = (notif) => {
    if (!notif.isRead) handleMarkRead(notif._id);
    if (notif.type?.startsWith("group_meetup") || notif.relatedModel === "Meeting") {
      navigate("/groups");
    } else if (notif.relatedModel === "Group" || notif.type === "general") {
      navigate("/groups");
    } else if (notif.relatedModel === "KuppiPost") {
      navigate("/kuppi");
    } else if (notif.relatedModel === "Note" || notif.relatedModel === "Comment") {
      navigate("/notes");
    }
  };

  // Filter notifications based on selected filter
  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter(n => !n.isRead);
    return notifications;
  }, [notifications, filter]);

  const groupedNotifications = useMemo(() => groupNotificationsByDate(filteredNotifications), [filteredNotifications]);

  const groupTitles = {
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    older: "Earlier"
  };

  const hasNotifications = Object.values(groupedNotifications).some(group => group.length > 0);
  const summaryCards = [
    { label: "Unread", value: unreadCount, hint: unreadCount > 0 ? "Needs attention" : "All clear", accent: "summary-unread" },
    { label: "Today", value: groupedNotifications.today.length, hint: "Fresh updates", accent: "summary-today" },
    { label: "This Week", value: groupedNotifications.thisWeek.length + groupedNotifications.yesterday.length, hint: "Recent activity", accent: "summary-week" },
    { label: "Total", value: notifications.length, hint: "All notifications", accent: "summary-total" },
  ];

  return (
    <div className="notifications-page">
      {/* Header with glassmorphic effect */}
      <header className="notifications-header">
        <div className="notifications-header-left">
          <button onClick={() => navigate("/dashboard")} className="back-btn" aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
          <div className="header-title-section">
            <h1>
              <Bell size={28} className="bell-icon" />
              Notifications
            </h1>
            <p className="unread-badge">
              {unreadCount > 0 ? (
                <span className="unread-count">{unreadCount} unread</span>
              ) : (
                <span className="all-caught">All caught up! <Sparkles size={14} /></span>
              )}
            </p>
          </div>
        </div>
        <div className="notifications-header-right">
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Filter notifications"
          >
            <Filter size={18} />
          </button>
          {unreadCount > 0 && (
            <button className="mark-all-btn" onClick={handleMarkAllRead}>
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>
      </header>

      {!loading && (
        <section className="notifications-summary" aria-label="Notification summary">
          {summaryCards.map((card) => (
            <article key={card.label} className={`summary-card ${card.accent}`}>
              <span className="summary-label">{card.label}</span>
              <strong className="summary-value">{card.value}</strong>
              <span className="summary-hint">{card.hint}</span>
            </article>
          ))}
        </section>
      )}

      {/* Filter bar */}
      {showFilters && (
        <div className="filter-bar animate-slide-down">
          <button
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <Eye size={14} /> All
          </button>
          <button
            className={`filter-chip ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            <EyeOff size={14} /> Unread
          </button>
        </div>
      )}

      {/* Loading state with shimmer effect */}
      {loading && (
        <div className="skeleton-container">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-notif">
              <div className="skeleton-icon"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-message"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state with illustration */}
      {!loading && !hasNotifications && (
        <div className="empty-state-modern">
          <div className="empty-icon">🔔✨</div>
          <h3>Quiet for now</h3>
          <p>When something important happens, you'll find it here.</p>
          <button className="explore-btn" onClick={() => navigate("/dashboard")}>
            Explore dashboard
          </button>
        </div>
      )}

      {/* Notification groups */}
      {!loading && hasNotifications && (
        <div className="notifications-container">
          {Object.entries(groupedNotifications).map(([groupKey, notifs]) =>
            notifs.length > 0 && (
              <div key={groupKey} className="notification-group">
                <div className="group-header">
                  <span className="group-title">{groupTitles[groupKey]}</span>
                  <div className="group-line"></div>
                </div>
                <div className="notifications-list">
                  {notifs.map((notif) => {
                    const cfg = getConfig(notif.type);
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={notif._id}
                        className={`notification-card ${!notif.isRead ? "unread" : ""} ${cfg.glow} fade-in-up`}
                      >
                        <div className={`notif-icon-container ${cfg.gradient}`}>
                          <Icon size={20} strokeWidth={1.8} />
                        </div>
                        <div className="notif-details">
                          <div className="notif-header">
                            <span className="notif-title">{notif.title}</span>
                            <span className="notif-time">{formatTimeAgo(notif.createdAt)}</span>
                          </div>
                          <p className="notif-message">{notif.message}</p>
                          <div className="notif-footer">
                            <button
                              className="action-link"
                              onClick={() => handleNotifNavigate(notif)}
                            >
                              View details <ExternalLink size={12} />
                            </button>
                            <span className={`badge-modern ${cfg.gradient}`}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                        {!notif.isRead && (
                          <button
                            className="mark-read-btn"
                            onClick={() => handleMarkRead(notif._id)}
                            title="Mark as read"
                          >
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Enhanced pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="pagination-modern">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="page-btn"
          >
            Previous
          </button>
          <div className="page-info">
            <span className="current-page">{currentPage}</span>
            <span className="separator">/</span>
            <span className="total-pages">{pagination.pages}</span>
          </div>
          <button
            disabled={currentPage >= pagination.pages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

function formatTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default Notifications;