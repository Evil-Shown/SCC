import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Users, BookOpen, Layers, Zap, MessageSquare, TrendingUp, ShieldCheck, UserPlus } from "lucide-react";
import adminApi from "../../services/adminApi";

const COLORS = ["#818cf8", "#34d399", "#f472b6", "#fb923c", "#60a5fa"];

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div className="admin-stat-card" style={{ "--card-accent": color }}>
      <div className="admin-stat-icon" style={{ background: `${color}22` }}>
        <Icon size={22} color={color} />
      </div>
      <div className="admin-stat-info">
        <span className="admin-stat-label">{label}</span>
        <span className="admin-stat-value">{value?.toLocaleString() ?? "—"}</span>
        {sub && <span className="admin-stat-sub">{sub}</span>}
      </div>
      {trend !== undefined && (
        <div className="admin-stat-trend" style={{ color: trend >= 0 ? "#34d399" : "#f87171" }}>
          <TrendingUp size={14} />
          <span>+{trend} this week</span>
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#1e1b4b", border: "1px solid #4338ca", borderRadius: 8, padding: "8px 14px" }}>
        <p style={{ color: "#a5b4fc", marginBottom: 4, fontSize: 12 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: 0, fontSize: 13, fontWeight: 600 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getAnalytics();
      setData(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>;
  if (!data) return <div className="admin-error">Failed to load analytics.</div>;

  const { stats, charts } = data;

  return (
    <div className="admin-overview">
      {/* Stat Cards */}
      <div className="admin-stats-grid">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} sub={`${stats.verifiedUsers} verified`} color="#818cf8" trend={stats.newUsersThisWeek} />
        <StatCard icon={Layers} label="Study Groups" value={stats.totalGroups} color="#34d399" trend={stats.newGroupsThisWeek} />
        <StatCard icon={BookOpen} label="Notes Shared" value={stats.totalNotes} color="#f472b6" />
        <StatCard icon={Zap} label="Kuppi Posts" value={stats.totalKuppi} color="#fb923c" />
        <StatCard icon={MessageSquare} label="Messages Sent" value={stats.totalMessages} color="#60a5fa" />
        <StatCard icon={ShieldCheck} label="Verified Users" value={stats.verifiedUsers} sub={`${Math.round((stats.verifiedUsers / Math.max(stats.totalUsers, 1)) * 100)}% of total`} color="#a78bfa" />
        <StatCard icon={UserPlus} label="New Users (7d)" value={stats.newUsersThisWeek} color="#4ade80" />
        <StatCard icon={TrendingUp} label="New Groups (7d)" value={stats.newGroupsThisWeek} color="#f59e0b" />
      </div>

      <div className="admin-charts-row">
        {/* Registrations Area Chart */}
        <div className="admin-chart-card wide">
          <h3 className="admin-chart-title">User Registrations — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={charts.registrationsChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="users" name="New Users" stroke="#818cf8" fill="url(#regGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Messages Bar Chart */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Messages Sent — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.weeklyMessagesChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="messages" name="Messages" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-charts-row">
        {/* Role Pie */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-title">User Role Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={charts.roleDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {charts.roleDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Departments */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Top Departments</h3>
          <div className="admin-dept-list">
            {charts.departmentDistribution.map((dept, i) => {
              const maxCount = charts.departmentDistribution[0]?.count || 1;
              return (
                <div key={i} className="admin-dept-item">
                  <div className="admin-dept-header">
                    <span className="admin-dept-name">{dept.name}</span>
                    <span className="admin-dept-count">{dept.count}</span>
                  </div>
                  <div className="admin-dept-bar-bg">
                    <div className="admin-dept-bar-fill" style={{ width: `${(dept.count / maxCount) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
