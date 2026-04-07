import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import AppLogo from "../components/AppLogo";
import "../styles/pages/admin.css";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];
const VERIFICATION_OPTIONS = [
  { value: "", label: "All verification" },
  { value: "Approved", label: "Approved" },
  { value: "Pending", label: "Pending" },
];

const statusBadgeClass = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "active") return "is-success";
  if (value === "inactive") return "is-danger";
  return "is-muted";
};

const verificationBadgeClass = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "approved") return "is-success";
  if (value === "pending") return "is-warn";
  return "is-muted";
};

export default function AdminProfessionals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [professionals, setProfessionals] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [updatingProfessionalId, setUpdatingProfessionalId] = useState(null);

  const loadProfessionals = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getProfessionals();
      setProfessionals(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e?.message || "Failed to load professionals.");
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfessionals();
  }, []);

  const filteredProfessionals = useMemo(() => {
    const query = search.trim().toLowerCase();
    return professionals.filter((professional) => {
      const matchesSearch =
        !query ||
        String(professional?.displayName || "").toLowerCase().includes(query) ||
        String(professional?.phone || "").toLowerCase().includes(query);

      const matchesStatus =
        !statusFilter ||
        professional?.status === statusFilter;

      const matchesVerification =
        !verificationFilter ||
        professional?.verificationStatus === verificationFilter;

      return matchesSearch && matchesStatus && matchesVerification;
    });
  }, [professionals, search, statusFilter, verificationFilter]);

  const handleToggleStatus = async (professional) => {
    if (!professional?.id) return;
    const nextActive = professional.status !== "Active";
    const action = nextActive ? "Activate" : "Deactivate";
    const ok = window.confirm(
      `${action} ${professional.displayName || "this professional"}?`
    );
    if (!ok) return;

    try {
      setUpdatingProfessionalId(professional.id);
      // Using direct axios call since API client doesn't have this method
      const response = await fetch(`/api/professionals/${professional.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        },
        body: JSON.stringify({ isActive: nextActive })
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      await loadProfessionals();
      if (selectedProfessional?.id === professional.id) {
        setSelectedProfessional((prev) => (prev ? { ...prev, status: nextActive ? "Active" : "Inactive" } : prev));
      }
    } catch (e) {
      alert(e?.message || "Unable to update professional status.");
    } finally {
      setUpdatingProfessionalId(null);
    }
  };

  const handleToggleVerification = async (professional) => {
    if (!professional?.id) return;
    const nextVerified = professional.verificationStatus !== "Approved";
    const action = nextVerified ? "Approve" : "Reject";
    const ok = window.confirm(
      `${action} ${professional.displayName || "this professional"}?`
    );
    if (!ok) return;

    try {
      setUpdatingProfessionalId(professional.id);
      // Using direct axios call since API client doesn't have this method
      const response = await fetch(`/api/professionals/${professional.id}/verification`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        },
        body: JSON.stringify({ isVerified: nextVerified })
      });

      if (!response.ok) {
        throw new Error("Failed to update verification");
      }

      await loadProfessionals();
      if (selectedProfessional?.id === professional.id) {
        setSelectedProfessional((prev) => (prev ? { ...prev, verificationStatus: nextVerified ? "Approved" : "Pending" } : prev));
      }
    } catch (e) {
      alert(e?.message || "Unable to update professional verification.");
    } finally {
      setUpdatingProfessionalId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_user");
    api.clearToken();
    navigate("/admin");
  };

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div className="admin-brand">
          <Link to="/home" className="admin-logo">
            <AppLogo />
          </Link>
          <div>
            <p className="admin-console-kicker">Operations workspace</p>
            <h2>Admin Console</h2>
          </div>
        </div>
        <div className="admin-top-actions">
          <Link className="admin-btn outline" to="/admin/dashboard">
            Dashboard
          </Link>
          <Link className="admin-btn outline" to="/admin/bookings">
            Bookings
          </Link>
          <Link className="admin-btn outline" to="/admin/users">
            Users
          </Link>
          <button className="admin-btn outline admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-hero">
        <div>
          <p className="admin-console-kicker">Professionals module</p>
          <h3>Professionals</h3>
          <p className="admin-hero-subtitle">
            Review professional accounts, search quickly, and manage verification and activation status.
          </p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-row-filters">
          <input
            type="text"
            placeholder="Search by name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)}>
            {VERIFICATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="admin-muted">Loading professionals...</p>
        ) : error ? (
          <p className="admin-error">{error}</p>
        ) : filteredProfessionals.length === 0 ? (
          <p className="admin-muted">No professionals found.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-row admin-table-head">
              <span>ID</span>
              <span>Name</span>
              <span>Phone</span>
              <span>City</span>
              <span>Services</span>
              <span>Status</span>
              <span>Verification</span>
              <span>Actions</span>
            </div>
            {filteredProfessionals.map((professional) => (
              <div key={professional.id} className="admin-table-row">
                <span className="admin-muted">{professional.id}</span>
                <span>{professional.displayName || "Unknown professional"}</span>
                <span>{professional.phone || "-"}</span>
                <span>{professional.cityName || "-"}</span>
                <span>
                  {Array.isArray(professional.skillCategoryIds) && professional.skillCategoryIds.length > 0
                    ? professional.skillCategoryIds.join(", ")
                    : "-"}
                </span>
                <span className={`admin-status-badge ${statusBadgeClass(professional.status)}`}>
                  {professional.status || "Unknown"}
                </span>
                <span className={`admin-status-badge ${verificationBadgeClass(professional.verificationStatus)}`}>
                  {professional.verificationStatus || "Unknown"}
                </span>
                <span className="admin-actions">
                  <button
                    className="admin-btn outline admin-btn-secondary"
                    onClick={() => setSelectedProfessional(professional)}
                  >
                    View
                  </button>
                  <button
                    className="admin-btn outline"
                    disabled={updatingProfessionalId === professional.id}
                    onClick={() => handleToggleStatus(professional)}
                  >
                    {updatingProfessionalId === professional.id
                      ? "Saving..."
                      : professional.status === "Active"
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                  <button
                    className="admin-btn outline"
                    disabled={updatingProfessionalId === professional.id}
                    onClick={() => handleToggleVerification(professional)}
                  >
                    {updatingProfessionalId === professional.id
                      ? "Saving..."
                      : professional.verificationStatus === "Approved"
                        ? "Reject"
                        : "Approve"}
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProfessional && (
        <div className="admin-modal" onClick={() => setSelectedProfessional(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Professional details</h3>
                <p className="admin-muted">{selectedProfessional.id}</p>
              </div>
              <button className="admin-btn outline" onClick={() => setSelectedProfessional(null)}>
                Close
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-detail-grid">
                <div>
                  <strong>Name:</strong>
                  <p>{selectedProfessional.displayName || "-"}</p>
                </div>
                <div>
                  <strong>Phone:</strong>
                  <p>{selectedProfessional.phone || "-"}</p>
                </div>
                <div>
                  <strong>City:</strong>
                  <p>{selectedProfessional.cityName || "-"}</p>
                </div>
                <div>
                  <strong>Status:</strong>
                  <p className={`admin-status-badge ${statusBadgeClass(selectedProfessional.status)}`}>
                    {selectedProfessional.status || "Unknown"}
                  </p>
                </div>
                <div>
                  <strong>Verification:</strong>
                  <p className={`admin-status-badge ${verificationBadgeClass(selectedProfessional.verificationStatus)}`}>
                    {selectedProfessional.verificationStatus || "Unknown"}
                  </p>
                </div>
                <div>
                  <strong>Services:</strong>
                  <p>
                    {Array.isArray(selectedProfessional.skillCategoryIds) && selectedProfessional.skillCategoryIds.length > 0
                      ? selectedProfessional.skillCategoryIds.join(", ")
                      : "No services specified"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
