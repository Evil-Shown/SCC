import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Calendar, Users, MessageSquare, ThumbsUp, Video, Info } from "lucide-react";
import {
  fetchNotifications,
  markAsReadAction,
  markAllAsReadAction,
} from "../features/notifications/notificationsSlice";

const getNotifIcon = (type) => {
  if (type?.startsWith("group_meetup")) return <Calendar size={16} style={{ color: "var(--color-primary-500)" }} />;
  if (type === "kuppi_scheduled") return <Video size={16} style={{ color: "var(--color-secondary-500)" }} />;
  if (type === "note_reaction") return <ThumbsUp size={16} style={{ color: "var(--color-warning)" }} />;
  if (type === "note_comment") return <MessageSquare size={16} style={{ color: "var(--color-info)" }} />;
  if (type === "general") return <Users size={16} style={{ color: "var(--color-success)" }} />;
  return <Info size={16} style={{ color: "var(--color-text-tertiary)" }} />;
};

const NotificationBell = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleToggle = () => {
    setOpen(!open);
    if (!open) dispatch(fetchNotifications({ limit: 10 }));
  };

  const handleNotifClick = (notif) => {
    if (!notif.isRead) dispatch(markAsReadAction(notif._id));
    setOpen(false);

    // Navigate to correct page based on type/model
    if (notif.type?.startsWith("group_meetup") || notif.relatedModel === "Meeting") {
      // Navigate to the group's meetups tab
      // relatedId is the Meeting._id; we need the groupId
      // Best effort: navigate to groups page
      navigate("/groups");
    } else if (notif.relatedModel === "Group" || notif.type === "general") {
      navigate("/groups");
    } else if (notif.relatedModel === "KuppiPost") {
      navigate("/kuppi");
    } else if (notif.relatedModel === "Note" || notif.relatedModel === "Comment") {
      navigate("/notes");
    } else {
      navigate("/notifications");
    }
  };

  return (
    <div className="notification-bell-wrapper" ref={ref}>
      <button className="uiverse-bell-btn" onClick={handleToggle} aria-label="Notifications">
        <Bell size={24} strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="uiverse-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown uiverse-glass fade-in">
          <div className="notification-dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={() => dispatch(markAllAsReadAction())}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="notification-dropdown-body">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={24} />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 8).map((notif) => (
                <div
                  key={notif._id}
                  className={`notification-dropdown-item ${!notif.isRead ? "unread" : ""}`}
                  onClick={() => handleNotifClick(notif)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="notif-icon-sm">{getNotifIcon(notif.type)}</div>
                  <div className="notif-dropdown-content">
                    <span className="notif-dropdown-title">{notif.title}</span>
                    <span className="notif-dropdown-msg">{notif.message}</span>
                    <span className="notif-dropdown-time">{formatTimeAgo(notif.createdAt)}</span>
                  </div>
                  {!notif.isRead && <span className="notif-dot" />}
                </div>
              ))
            )}
          </div>

          <div className="notification-dropdown-footer">
            <button onClick={() => { setOpen(false); navigate("/notifications"); }}>
              View all notifications
            </button>
          </div>
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

export default NotificationBell;
