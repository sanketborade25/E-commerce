import { useEffect, useState } from "react";
import { api } from "../../api/client";
import AdminLayout from "../../components/admin/AdminLayout";
import { notifyAdminDataChanged } from "./adminUtils";

const emptyForm = { name: "", slug: "" };

export default function AdminCities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadCities = async () => {
    setLoading(true);
    try {
      const res = await api.getCities({ includeInactive: true });
      setCities(Array.isArray(res) ? res : []);
    } catch {
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm(emptyForm);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (city) => {
    setEditingItem(city);
    setForm({
      name: city?.name || "",
      slug: city?.slug || ""
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) return;

    setSaving(true);
    try {
      const payload = {
        name,
        slug: form.slug.trim() || null
      };

      if (editingItem?.id) {
        await api.updateCity(editingItem.id, payload);
      } else {
        await api.createCity(payload);
      }

      closeModal();
      await loadCities();
      notifyAdminDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (city) => {
    if (!city?.id) return;
    setTogglingId(city.id);
    try {
      await api.updateCityStatus(city.id, !city.isActive);
      await loadCities();
      notifyAdminDataChanged();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (city) => {
    const ok = window.confirm(`Delete ${city?.name || "this city"}?`);
    if (!ok) return;
    await api.deleteCity(city.id);
    await loadCities();
    notifyAdminDataChanged();
  };

  return (
    <AdminLayout
      title="Cities"
      subtitle="Manage supported cities from a dedicated page with clear status controls."
      actions={
        <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
          Add City
        </button>
      }
    >
      <div className="admin-card">
        {loading ? (
          <p className="admin-muted">Loading cities...</p>
        ) : cities.length === 0 ? (
          <p className="admin-muted">No cities found.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-row admin-table-head admin-table-5">
              <span>Name</span>
              <span>Slug</span>
              <span>Status</span>
              <span>ID</span>
              <span>Actions</span>
            </div>
            {cities.map((city) => (
              <div key={city.id} className="admin-table-row admin-table-5">
                <span>
                  <strong>{city.name}</strong>
                </span>
                <span className="admin-muted">{city.slug || "-"}</span>
                <span
                  className={`admin-status-badge ${city.isActive ? "is-success" : "is-danger"}`}
                >
                  {city.isActive ? "Active" : "Inactive"}
                </span>
                <span className="admin-muted">{city.id}</span>
                <span className="admin-actions">
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => openEditModal(city)}
                  >
                    Edit
                  </button>
                  <button
                    className="admin-btn admin-btn-secondary"
                    disabled={togglingId === city.id}
                    onClick={() => handleToggleStatus(city)}
                  >
                    {togglingId === city.id
                      ? "Saving..."
                      : city.isActive
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={() => handleDelete(city)}
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal ? (
        <div className="admin-modal" onClick={closeModal}>
          <div className="admin-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingItem ? "Edit City" : "Add City"}</h3>
              <button className="admin-btn admin-btn-ghost" onClick={closeModal}>
                Close
              </button>
            </div>

            <div className="admin-modal-body admin-modal-form-grid">
              <input
                type="text"
                placeholder="City name"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Slug (optional)"
                value={form.slug}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, slug: event.target.value }))
                }
              />
            </div>

            <div className="admin-actions admin-modal-actions-end">
              <button className="admin-btn admin-btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? "Saving..." : editingItem ? "Save Changes" : "Create City"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
