import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import {
  fetchNotifications,
  markAsReadAction,
  markAllAsReadAction,
} from "../features/notifications/notificationsSlice";

const NotificationBell = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useSelector(
    (state) => state.notifications
  );
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 10 }));
  }, [dispatch]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleToggle = () => {
    setOpen(!open);
    if (!open) {
      dispatch(fetchNotifications({ limit: 10 }));
    }
  };

  return (
    <div className="notification-bell-wrapper" ref={ref}>
      <button className="notification-bell-btn" onClick={handleToggle}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown fade-in">
          <div className="notification-dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button
                className="mark-all-btn"
                onClick={() => dispatch(markAllAsReadAction())}
              >
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
                  onClick={() => {
                    if (!notif.isRead) dispatch(markAsReadAction(notif._id));
                    setOpen(false);
                    if (notif.relatedModel === "KuppiPost") navigate("/kuppi");
                    else navigate("/notes");
                  }}
                >
                  <div className="notif-dot-wrapper">
                    {!notif.isRead && <span className="notif-dot" />}
                  </div>
                  <div className="notif-dropdown-content">
                    <span className="notif-dropdown-title">{notif.title}</span>
                    <span className="notif-dropdown-msg">{notif.message}</span>
                    <span className="notif-dropdown-time">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="notification-dropdown-footer">
            <button
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
            >
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
