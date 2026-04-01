import { useEffect, useState, useCallback } from "react";
import { Database, Server, Code2, Clock, RefreshCw } from "lucide-react";
import adminApi from "../../services/adminApi";

function HealthRow({ icon: Icon, label, value, color }) {
  return (
    <div className="health-row">
      <div className="health-row-left">
        <Icon size={16} color={color || "#818cf8"} />
        <span className="health-label">{label}</span>
      </div>
      <span className="health-value" style={{ color: color || "#e2e8f0" }}>{value}</span>
    </div>
  );
}

function CollectionCard({ name, count }) {
  return (
    <div className="health-collection-card">
      <span className="health-collection-name">{name}</span>
      <span className="health-collection-count">{count?.toLocaleString()}</span>
    </div>
  );
}

export default function SystemHealthTab() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await adminApi.getSystemHealth();
      setHealth(res.data.data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Health fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>;

  return (
    <div className="admin-tab-content">
      <div className="health-grid">
        {/* Server Status Card */}
        <div className="health-card">
          <div className="health-card-header">
            <Server size={18} color="#818cf8" />
            <h3>Server Status</h3>
            <div className="health-pulse">
              <span className="health-pulse-dot" />
              <span style={{ color: "#34d399", fontSize: 12, fontWeight: 600 }}>Online</span>
            </div>
          </div>
          <div className="health-rows">
            <HealthRow icon={Server} label="API Server" value="✓ Running" color="#34d399" />
            <HealthRow icon={Database} label="Database" value="✓ Connected" color="#34d399" />
            <HealthRow icon={Code2} label="Node.js Version" value={health?.nodeVersion || "—"} />
            <HealthRow icon={Clock} label="Environment" value={health?.environment || "—"} />
          </div>
        </div>

        {/* Timestamp Card */}
        <div className="health-card">
          <div className="health-card-header">
            <Clock size={18} color="#60a5fa" />
            <h3>Server Time</h3>
          </div>
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#e2e8f0", letterSpacing: 2 }}>
              {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : "—"}
            </div>
            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>
              {health?.timestamp ? new Date(health.timestamp).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : ""}
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#4b5563", fontSize: 12 }}>
              <RefreshCw size={12} />
              Last refreshed: {lastRefresh?.toLocaleTimeString() || "—"} (auto every 10s)
            </div>
          </div>
        </div>
      </div>

      {/* Collections Card */}
      <div className="health-card" style={{ marginTop: 16 }}>
        <div className="health-card-header">
          <Database size={18} color="#f472b6" />
          <h3>Database Collections</h3>
        </div>
        <div className="health-collections-grid">
          {health?.collections &&
            Object.entries(health.collections).map(([name, count]) => (
              <CollectionCard key={name}
                name={name.charAt(0).toUpperCase() + name.slice(1)}
                count={count}
              />
            ))
          }
        </div>
      </div>
    </div>
  );
}
