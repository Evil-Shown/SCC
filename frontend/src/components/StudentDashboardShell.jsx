import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Home as HomeIcon,
  LayoutDashboard,
  GraduationCap,
  Brain,
  BookMarked,
  Video,
  Users,
  LogOut,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import NotificationBell from "./NotificationBell";
import { logout } from "../features/auth/authSlice";
import { fetchMyInvites, selectMyInvites } from "../features/groups/groupSlice";
import { confirmAction } from "../utils/toast";
import "../styles/Dashboard.css";

export function isStudentNavActive(pathname, linkPath) {
  if (linkPath === "/") return pathname === "/" || pathname === "/home";
  if (linkPath === "/groups") return pathname === "/groups" || pathname.startsWith("/groups/");
  return pathname === linkPath;
}

const NAV_LINKS = [
  { icon: HomeIcon, label: "Home", path: "/" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: GraduationCap, label: "Exam Mode", path: "/exam-mode" },
  { icon: Brain, label: "Timetable", path: "/timetable" },
  { icon: BookMarked, label: "Notes", path: "/notes" },
  { icon: Video, label: "Kuppi", path: "/kuppi" },
  { icon: Users, label: "Groups", path: "/groups" },
];

export default function StudentDashboardShell({ children, focusMode = false }) {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const myInvites = useSelector(selectMyInvites);
  const pendingInvites = myInvites?.length || 0;

  useEffect(() => {
    if (user?._id) dispatch(fetchMyInvites());
  }, [dispatch, user?._id]);

  const handleLogout = async () => {
    const confirmed = await confirmAction("Are you sure you want to log out?", {
      confirmText: "Log out",
    });
    if (!confirmed) return;
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className={`dashboard ${focusMode ? "focus-mode" : ""}`} data-theme={theme}>
      <div className="dashboard-bg" aria-hidden="true">
        <span className="bg-orb bg-orb--one" />
        <span className="bg-orb bg-orb--two" />
        <span className="bg-orb bg-orb--three" />
        <span className="bg-grid" />
      </div>

      <header className="dashboard-header dashboard-header--visible">
        <Link to="/dashboard" className="dashboard-logo">
          <span className="dashboard-logo__text">User Dashboard</span>
        </Link>
        <nav className="dashboard-nav" aria-label="Main">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const active = isStudentNavActive(location.pathname, link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`dashboard-nav__link ${active ? "active" : ""}`}
              >
                <Icon size={18} strokeWidth={1.75} />
                <span>{link.label}</span>
                {link.path === "/groups" && pendingInvites > 0 && (
                  <span className="dashboard-nav__badge" aria-label={`${pendingInvites} pending invites`}>
                    {pendingInvites > 9 ? "9+" : pendingInvites}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="dashboard-actions">
          <NotificationBell />
          <button type="button" className="dashboard-profile-btn" onClick={() => navigate("/profile")}>
            <span className="dashboard-avatar">{user?.name?.charAt(0) || "U"}</span>
            <span className="dashboard-profile-name">{user?.name?.split(" ")[0]}</span>
          </button>
          <button type="button" className="logout-btn" onClick={handleLogout} aria-label="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {children}
    </div>
  );
}
