import { useEffect, useState, useCallback } from "react";
import { Trash2, Search, ChevronLeft, ChevronRight, Tag } from "lucide-react";
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

export default function NotesTab() {
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchNotes = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.getNotes({ page, limit: 15, search });
      setNotes(res.data.data.notes);
      setPagination(res.data.data.pagination);
    } catch (e) {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchNotes(1); }, [fetchNotes]);

  const handleDelete = async () => {
    try {
      await adminApi.deleteNote(deleteTarget);
      toast.success("Note deleted");
      setDeleteTarget(null);
      fetchNotes(pagination.page);
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="admin-tab-content">
      {deleteTarget && (
        <ConfirmModal
          message="Permanently delete this note?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <div className="admin-table-toolbar">
        <div className="admin-search-box">
          <Search size={15} color="#6b7280" />
          <input
            className="admin-search-input"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="admin-total-badge">{pagination.total} notes</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Subject</th>
              <th>Tags</th>
              <th>Year</th>
              <th>Likes</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="admin-table-empty"><div className="admin-spinner" /></td></tr>
            ) : notes.length === 0 ? (
              <tr><td colSpan={8} className="admin-table-empty">No notes found</td></tr>
            ) : notes.map((note) => (
              <tr key={note._id}>
                <td>
                  <div style={{ fontWeight: 600, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {note.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{note.description?.slice(0, 60)}...</div>
                </td>
                <td className="admin-cell-muted">{note.userId?.name || "—"}</td>
                <td className="admin-cell-muted">{note.subject || "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {note.tags?.slice(0, 2).map((tag, i) => (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#4338ca33", color: "#a5b4fc", padding: "1px 7px", borderRadius: 99, fontSize: 11 }}>
                        <Tag size={9} /> {tag}
                      </span>
                    ))}
                    {note.tags?.length > 2 && <span style={{ color: "#6b7280", fontSize: 11 }}>+{note.tags.length - 2}</span>}
                  </div>
                </td>
                <td className="admin-cell-muted">{note.year || "—"}</td>
                <td style={{ color: "#34d399", fontWeight: 600 }}>{note.reactionsCount?.likes ?? 0}</td>
                <td className="admin-cell-muted">{new Date(note.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="admin-icon-btn danger" onClick={() => setDeleteTarget(note._id)} title="Delete">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <button className="admin-page-btn" disabled={pagination.page <= 1} onClick={() => fetchNotes(pagination.page - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="admin-page-info">Page {pagination.page} of {pagination.totalPages}</span>
        <button className="admin-page-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchNotes(pagination.page + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
