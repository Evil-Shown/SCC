import { useEffect, useState, useCallback } from "react";
import { Trash2, Edit2, Check, X, Search, ChevronLeft, ChevronRight, Shield, User, GraduationCap } from "lucide-react";
import adminApi from "../../services/adminApi";
import toast from "react-hot-toast";

const ROLES = ["student", "teacher", "admin"];

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

function RoleBadge({ role }) {
  const config = {
    admin: { color: "#f472b6", icon: Shield, bg: "#f472b633" },
    teacher: { color: "#60a5fa", icon: GraduationCap, bg: "#60a5fa33" },
    student: { color: "#34d399", icon: User, bg: "#34d39933" },
  };
  const { color, icon: Icon, bg } = config[role] || config.student;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: bg, color }}>
      <Icon size={11} /> {role}
    </span>
  );
}

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({ page, limit: 15, search, role: roleFilter });
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (e) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const handleEdit = (user) => {
    setEditId(user._id);
    setEditData({ name: user.name, role: user.role, department: user.department || "", year: user.year || "" });
  };

  const handleSave = async () => {
    try {
      await adminApi.updateUser(editId, editData);
      toast.success("User updated");
      setEditId(null);
      fetchUsers(pagination.page);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Update failed");
    }
  };

  const handleDelete = async () => {
    try {
      await adminApi.deleteUser(deleteTarget);
      toast.success("User deleted");
      setDeleteTarget(null);
      fetchUsers(pagination.page);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="admin-tab-content">
      {deleteTarget && (
        <ConfirmModal
          message="Are you sure you want to permanently delete this user?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="admin-table-toolbar">
        <div className="admin-search-box">
          <Search size={15} color="#6b7280" />
          <input
            className="admin-search-input"
            placeholder="Search by name, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="admin-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <span className="admin-total-badge">{pagination.total} users</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Year</th>
              <th>Verified</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="admin-table-empty"><div className="admin-spinner" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={8} className="admin-table-empty">No users found</td></tr>
            ) : users.map((user) => (
              <tr key={user._id} className={editId === user._id ? "admin-row-editing" : ""}>
                <td>
                  {editId === user._id ? (
                    <input className="admin-inline-input" value={editData.name} onChange={(e) => setEditData(d => ({ ...d, name: e.target.value }))} />
                  ) : (
                    <div className="admin-user-cell">
                      <div className="admin-avatar">{user.name?.charAt(0)?.toUpperCase()}</div>
                      <span>{user.name}</span>
                    </div>
                  )}
                </td>
                <td className="admin-cell-muted">{user.email}</td>
                <td>
                  {editId === user._id ? (
                    <select className="admin-select-sm" value={editData.role} onChange={(e) => setEditData(d => ({ ...d, role: e.target.value }))}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : <RoleBadge role={user.role} />}
                </td>
                <td>
                  {editId === user._id ? (
                    <input className="admin-inline-input" value={editData.department} onChange={(e) => setEditData(d => ({ ...d, department: e.target.value }))} />
                  ) : <span className="admin-cell-muted">{user.department || "—"}</span>}
                </td>
                <td>
                  {editId === user._id ? (
                    <input className="admin-inline-input" type="number" min={1} max={5} value={editData.year} onChange={(e) => setEditData(d => ({ ...d, year: e.target.value }))} style={{ width: 60 }} />
                  ) : <span className="admin-cell-muted">{user.year || "—"}</span>}
                </td>
                <td>
                  <span style={{ color: user.isVerified ? "#34d399" : "#f87171", fontWeight: 600, fontSize: 12 }}>
                    {user.isVerified ? "✓ Yes" : "✗ No"}
                  </span>
                </td>
                <td className="admin-cell-muted">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="admin-actions-cell">
                    {editId === user._id ? (
                      <>
                        <button className="admin-icon-btn success" onClick={handleSave} title="Save"><Check size={15} /></button>
                        <button className="admin-icon-btn ghost" onClick={() => setEditId(null)} title="Cancel"><X size={15} /></button>
                      </>
                    ) : (
                      <>
                        <button className="admin-icon-btn" onClick={() => handleEdit(user)} title="Edit"><Edit2 size={15} /></button>
                        <button className="admin-icon-btn danger" onClick={() => setDeleteTarget(user._id)} title="Delete"><Trash2 size={15} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <button className="admin-page-btn" disabled={pagination.page <= 1} onClick={() => fetchUsers(pagination.page - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="admin-page-info">Page {pagination.page} of {pagination.totalPages}</span>
        <button className="admin-page-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchUsers(pagination.page + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
