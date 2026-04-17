import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import {
  LayoutDashboard, Users, Layers, BookOpen, Zap,
  Activity, ArrowLeft, RefreshCw, LogOut
} from "lucide-react";
import "../pages/admin/AdminDashboard.css";
import OverviewTab from "./admin/OverviewTab";
import UsersTab from "./admin/UsersTab";
import GroupsTab from "./admin/GroupsTab";
import NotesTab from "./admin/NotesTab";
import KuppiTab from "./admin/KuppiTab";
import SystemHealthTab from "./admin/SystemHealthTab";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "groups", label: "Groups", icon: Layers },
  { id: "notes", label: "Notes", icon: BookOpen },
  { id: "kuppi", label: "Kuppi Posts", icon: Zap },
  { id: "health", label: "System Health", icon: Activity },
];

const TAB_TITLES = {
  overview: { title: "Dashboard Overview", sub: "Live analytics · auto-refreshes every 30s" },
  users: { title: "User Management", sub: "View, edit and delete platform users" },
  groups: { title: "Group Management", sub: "Monitor and manage all study groups" },
  notes: { title: "Notes Management", sub: "Browse and moderate shared notes" },
  kuppi: { title: "Kuppi Post Management", sub: "Manage tutoring session posts" },
  health: { title: "System Health", sub: "Server and database monitoring · auto-refreshes every 10s" },
};

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("overview");

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  // Guard: only admins
  if (!user || user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const currentTitle = TAB_TITLES[activeTab];

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <h2>Admin Dashboard</h2>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item, i) => {
            const Icon = item.icon;
            const isDivider = i === 4; // divider before System Health
            return (
              <div key={item.id}>
                {isDivider && <div className="admin-nav-divider" />}
                <button
                  id={`admin-nav-${item.id}`}
                  className={`admin-nav-btn ${activeTab === item.id ? "active" : ""}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="admin-sidebar-user-info">
              <p className="admin-sidebar-user-name">{user.name}</p>
              <p className="admin-sidebar-user-role">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-title">
            <h1>{currentTitle.title}</h1>
            <p>{currentTitle.sub}</p>
          </div>
          <div className="admin-header-right">
            <div className="admin-refresh-badge">
              <RefreshCw size={11} />
              Live Data
            </div>
            <button className="admin-logout-btn" onClick={handleLogout}>
              <LogOut size={15} />
              Sign Out
            </button>
            <Link to="/" className="admin-back-btn">
              <ArrowLeft size={15} />
              Back to App
            </Link>
          </div>
        </header>

        {/* Tab Content */}
        <main className="admin-content">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "groups" && <GroupsTab />}
          {activeTab === "notes" && <NotesTab />}
          {activeTab === "kuppi" && <KuppiTab />}
          {activeTab === "health" && <SystemHealthTab />}
        </main>
      </div>
    </div>
  );
}
