import { useEffect, useState, useCallback } from "react";
import { Trash2, Search, ChevronLeft, ChevronRight, Globe, Lock, Users } from "lucide-react";
import adminApi from "../../services/adminApi";
import toast from "react-hot-toast";

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <p className="admin-modal-msg">{message}</p>
        <div className="admin-modal-actions">
          <button className="admin-btn admin-btn-danger" onClick={onConfirm}>Delete</button>
          <button className="admin-btn admin-btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function GroupsTab() {
  const [groups, setGroups] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchGroups = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.getGroups({ page, limit: 15, search });
      setGroups(res.data.data.groups);
      setPagination(res.data.data.pagination);
    } catch (e) {
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchGroups(1); }, [fetchGroups]);

  const handleDelete = async () => {
    try {
      await adminApi.deleteGroup(deleteTarget);
      toast.success("Group deleted");
      setDeleteTarget(null);
      fetchGroups(pagination.page);
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="admin-tab-content">
      {deleteTarget && (
        <ConfirmModal
          message="Permanently delete this group and all its data?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="admin-table-toolbar">
        <div className="admin-search-box">
          <Search size={15} color="#6b7280" />
          <input
            className="admin-search-input"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="admin-total-badge">{pagination.total} groups</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Creator</th>
              <th>Subject</th>
              <th>Members</th>
              <th>Visibility</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="admin-table-empty"><div className="admin-spinner" /></td></tr>
            ) : groups.length === 0 ? (
              <tr><td colSpan={7} className="admin-table-empty">No groups found</td></tr>
            ) : groups.map((group) => (
              <tr key={group._id}>
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-avatar" style={{ background: "#4338ca44", color: "#818cf8" }}>
                      {group.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{group.name}</div>
                      {group.courseCode && <div style={{ fontSize: 11, color: "#6b7280" }}>{group.courseCode}</div>}
                    </div>
                  </div>
                </td>
                <td className="admin-cell-muted">{group.creator?.name || "—"}</td>
                <td className="admin-cell-muted">{group.subject || "—"}</td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#a5b4fc" }}>
                    <Users size={13} /> {group.members?.length ?? 0}
                  </span>
                </td>
                <td>
                  {group.isPublic ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#34d399", fontSize: 12, fontWeight: 600 }}>
                      <Globe size={12} /> Public
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#f87171", fontSize: 12, fontWeight: 600 }}>
                      <Lock size={12} /> Private
                    </span>
                  )}
                </td>
                <td className="admin-cell-muted">{new Date(group.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="admin-icon-btn danger" onClick={() => setDeleteTarget(group._id)} title="Delete">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <button className="admin-page-btn" disabled={pagination.page <= 1} onClick={() => fetchGroups(pagination.page - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="admin-page-info">Page {pagination.page} of {pagination.totalPages}</span>
        <button className="admin-page-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchGroups(pagination.page + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
