import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Video,
  Info,
  ExternalLink,
  Check,
} from "lucide-react";
import {
  fetchNotifications,
  markAsReadAction,
  markAllAsReadAction,
} from "../features/notifications/notificationsSlice";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import "../styles/Notifications.css";

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, pagination } = useSelector(
    (state) => state.notifications
  );
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchNotifications({ page: currentPage, limit: 20 }));
  }, [dispatch, currentPage]);

  const handleMarkRead = (id) => {
    dispatch(markAsReadAction(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsReadAction());
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case "note_reaction":
        return <ThumbsUp size={18} />;
      case "note_comment":
        return <MessageSquare size={18} />;
      case "kuppi_scheduled":
        return <Video size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  const getNotifColor = (type) => {
    switch (type) {
      case "note_reaction":
        return "notif-reaction";
      case "note_comment":
        return "notif-comment";
      case "kuppi_scheduled":
        return "notif-kuppi";
      default:
        return "notif-general";
    }
  };

  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <div className="notifications-header-left">
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>
              <Bell size={24} /> Notifications
            </h1>
            <p>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-outline btn-sm"
            onClick={handleMarkAllRead}
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </header>

      {loading && <LoadingSpinner text="Loading notifications..." />}

      {!loading && notifications.length === 0 && (
        <EmptyState
          icon="🔔"
          title="No notifications"
          description="You'll receive notifications for reactions, comments, and kuppi updates"
        />
      )}

      {!loading && notifications.length > 0 && (
        <div className="notifications-list">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`notification-item hover-glow ${!notif.isRead ? "unread" : ""} ${getNotifColor(notif.type)} fade-in`}
            >
              <div className={`notif-icon-wrapper ${getNotifColor(notif.type)}`}>
                {getNotifIcon(notif.type)}
              </div>
              <div className="notif-content">
                <div className="notif-title-row">
                  <span className="notif-title">{notif.title}</span>
                  <span className="notif-time">
                    {formatTimeAgo(notif.createdAt)}
                  </span>
                </div>
                <p className="notif-message">{notif.message}</p>
                {notif.relatedId && notif.relatedModel === "KuppiPost" && (
                  <button
                    className="notif-action-link"
                    onClick={() => navigate("/kuppi")}
                  >
                    View Kuppi <ExternalLink size={14} />
                  </button>
                )}
                {notif.relatedId && (notif.relatedModel === "Note" || notif.relatedModel === "Comment") && (
                  <button
                    className="notif-action-link"
                    onClick={() => navigate("/notes")}
                  >
                    View Note <ExternalLink size={14} />
                  </button>
                )}
              </div>
              {!notif.isRead && (
                <button
                  className="notif-mark-read"
                  onClick={() => handleMarkRead(notif._id)}
                  title="Mark as read"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="notifications-pagination">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {pagination.pages}
          </span>
          <button
            disabled={currentPage >= pagination.pages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// Helper to format time ago
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
