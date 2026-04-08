import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import AdminLayout from "../components/admin/AdminLayout";

const formatRole = (role) => {
  const value = String(role || "User").trim();
  return value ? value : "User";
};

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getUsers();
      setUsers(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e?.message || "Failed to load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        String(user?.fullName || "").toLowerCase().includes(query) ||
        String(user?.phone || "").toLowerCase().includes(query) ||
        String(user?.email || "").toLowerCase().includes(query);

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "ACTIVE" && user?.isActive) ||
        (statusFilter === "INACTIVE" && !user?.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const handleToggleStatus = async (user) => {
    if (!user?.id) return;
    const nextActive = !user.isActive;
    const ok = window.confirm(
      `${nextActive ? "Activate" : "Deactivate"} ${user.fullName || "this user"}?`
    );
    if (!ok) return;

    try {
      setUpdatingUserId(user.id);
      const updated = await api.updateUserStatus(user.id, nextActive);
      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? { ...item, ...updated } : item))
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, ...updated } : prev));
      }
    } catch (e) {
      alert(e?.message || "Unable to update user status.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <AdminLayout
      title="Users"
      subtitle="Review user accounts, search quickly, and activate or deactivate access."
    >
      <div className="admin-card">
        <div className="admin-row-filters">
          <input
            type="text"
            placeholder="Search by name, phone, or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {loading ? (
          <p className="admin-muted">Loading users...</p>
        ) : error ? (
          <p className="admin-error">{error}</p>
        ) : filteredUsers.length === 0 ? (
          <p className="admin-muted">No users found.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-row admin-table-head admin-table-6">
              <span>User ID</span>
              <span>Name</span>
              <span>Phone / Email</span>
              <span>Status</span>
              <span>Role</span>
              <span>Actions</span>
            </div>
            {filteredUsers.map((user) => (
              <div key={user.id} className="admin-table-row admin-table-6">
                <span className="admin-muted">{user.id}</span>
                <span>{user.fullName || "Unknown user"}</span>
                <span>
                  <strong>{user.phone || "-"}</strong>
                  <span className="admin-muted">{user.email || "-"}</span>
                </span>
                <span className={`admin-status-badge ${user.isActive ? "is-success" : "is-danger"}`}>
                  {user.isActive ? "Active" : "Inactive"}
                </span>
                <span>{formatRole(user.role)}</span>
                <span className="admin-actions">
                  <button
                    className="admin-btn admin-btn-ghost"
                    onClick={() => setSelectedUser(user)}
                  >
                    View
                  </button>
                  <button
                    className="admin-btn admin-btn-secondary"
                    disabled={updatingUserId === user.id}
                    onClick={() => handleToggleStatus(user)}
                  >
                    {updatingUserId === user.id
                      ? "Saving..."
                      : user.isActive
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="admin-modal" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>User details</h3>
                <p className="admin-muted">{selectedUser.id}</p>
              </div>
              <button className="admin-btn admin-btn-ghost" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
            <div className="admin-modal-body">
              <div>
                <strong>Name</strong>
                <p>{selectedUser.fullName || "Unknown user"}</p>
              </div>
              <div>
                <strong>Phone</strong>
                <p>{selectedUser.phone || "-"}</p>
              </div>
              <div>
                <strong>Email</strong>
                <p>{selectedUser.email || "-"}</p>
              </div>
              <div>
                <strong>Role</strong>
                <p>{formatRole(selectedUser.role)}</p>
              </div>
              <div>
                <strong>Status</strong>
                <p>{selectedUser.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
