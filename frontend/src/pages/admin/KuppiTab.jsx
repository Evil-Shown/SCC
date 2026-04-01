import { useEffect, useState, useCallback } from "react";
import { Trash2, Search, ChevronLeft, ChevronRight, Archive, Calendar } from "lucide-react";
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

export default function KuppiTab() {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchPosts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.getKuppiPosts({ page, limit: 15, search });
      setPosts(res.data.data.posts);
      setPagination(res.data.data.pagination);
    } catch (e) {
      toast.error("Failed to load kuppi posts");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchPosts(1); }, [fetchPosts]);

  const handleDelete = async () => {
    try {
      await adminApi.deleteKuppiPost(deleteTarget);
      toast.success("Kuppi post deleted");
      setDeleteTarget(null);
      fetchPosts(pagination.page);
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="admin-tab-content">
      {deleteTarget && (
        <ConfirmModal
          message="Permanently delete this Kuppi post?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <div className="admin-table-toolbar">
        <div className="admin-search-box">
          <Search size={15} color="#6b7280" />
          <input
            className="admin-search-input"
            placeholder="Search kuppi posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="admin-total-badge">{pagination.total} posts</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Tutor</th>
              <th>Subject</th>
              <th>Event Date</th>
              <th>Applicants</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="admin-table-empty"><div className="admin-spinner" /></td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={8} className="admin-table-empty">No kuppi posts found</td></tr>
            ) : posts.map((post) => (
              <tr key={post._id}>
                <td>
                  <div style={{ fontWeight: 600, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {post.title}
                  </div>
                </td>
                <td className="admin-cell-muted">{post.tutor?.name || "—"}</td>
                <td className="admin-cell-muted">{post.subject || "—"}</td>
                <td>
                  {post.eventDate ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#a5b4fc", fontSize: 12 }}>
                      <Calendar size={12} />
                      {new Date(post.eventDate).toLocaleDateString()}
                    </span>
                  ) : "—"}
                </td>
                <td style={{ color: "#60a5fa", fontWeight: 600 }}>
                  {post.applicants?.length ?? 0}
                </td>
                <td>
                  {post.isArchived ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#9ca3af", fontSize: 12, fontWeight: 600, background: "#9ca3af22", padding: "2px 8px", borderRadius: 99 }}>
                      <Archive size={11} /> Archived
                    </span>
                  ) : (
                    <span style={{ color: "#34d399", fontSize: 12, fontWeight: 600, background: "#34d39922", padding: "2px 8px", borderRadius: 99 }}>
                      Active
                    </span>
                  )}
                </td>
                <td className="admin-cell-muted">{new Date(post.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="admin-icon-btn danger" onClick={() => setDeleteTarget(post._id)} title="Delete">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <button className="admin-page-btn" disabled={pagination.page <= 1} onClick={() => fetchPosts(pagination.page - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="admin-page-info">Page {pagination.page} of {pagination.totalPages}</span>
        <button className="admin-page-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchPosts(pagination.page + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
