import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminFileInput from "../../components/admin/AdminFileInput";
import { notifyAdminDataChanged } from "./adminUtils";

const emptyForm = {
  serviceId: "",
  name: "",
  imageUrl: "",
  price: "",
  durationMinutes: ""
};

export default function AdminServiceOptions() {
  const [options, setOptions] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const serviceMap = useMemo(
    () => new Map(services.map((service) => [String(service.id), service])),
    [services]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [optionsRes, servicesRes] = await Promise.all([
        api.getServiceOptions(),
        api.getAdminServices()
      ]);
      setOptions(Array.isArray(optionsRes) ? optionsRes : []);
      setServices(Array.isArray(servicesRes) ? servicesRes : []);
    } catch {
      setOptions([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm(emptyForm);
    setUploadError("");
  };

  const openAddModal = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setUploadError("");
    setFileInputKey((key) => key + 1);
    setShowModal(true);
  };

  const openEditModal = (option) => {
    setEditingItem(option);
    setForm({
      serviceId: option?.serviceId ? String(option.serviceId) : "",
      name: option?.name || "",
      imageUrl: option?.imageUrl || "",
      price: option?.price != null ? String(option.price) : "",
      durationMinutes:
        option?.durationMinutes != null ? String(option.durationMinutes) : ""
    });
    setUploadError("");
    setFileInputKey((key) => key + 1);
    setShowModal(true);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const res = await api.uploadImage(file);
      if (res?.url) {
        setForm((prev) => ({ ...prev, imageUrl: res.url }));
      }
    } catch (error) {
      setUploadError(error?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const serviceId = Number(form.serviceId);
    const name = form.name.trim();
    const price = Number(form.price);
    if (!serviceId || !name || Number.isNaN(price)) return;

    setSaving(true);
    try {
      const payload = {
        serviceId,
        name,
        imageUrl: form.imageUrl || null,
        price,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null
      };

      if (editingItem?.id) {
        await api.updateServiceOption(editingItem.id, payload);
      } else {
        await api.createServiceOption(payload);
      }

      closeModal();
      await loadData();
      notifyAdminDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (option) => {
    const ok = window.confirm(`Delete ${option?.name || "this service option"}?`);
    if (!ok) return;
    await api.deleteServiceOption(option.id);
    await loadData();
    notifyAdminDataChanged();
  };

  return (
    <AdminLayout
      title="Service Options"
      subtitle="Manage price points and durations in a separate operational module."
      actions={
        <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
          Add Option
        </button>
      }
    >
      <div className="admin-card">
        {loading ? (
          <p className="admin-muted">Loading service options...</p>
        ) : options.length === 0 ? (
          <p className="admin-muted">No service options found.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-row admin-table-head admin-table-6">
              <span>ID</span>
              <span>Name</span>
              <span>Service</span>
              <span>Price</span>
              <span>Duration</span>
              <span>Actions</span>
            </div>
            {options.map((option) => (
              <div key={option.id} className="admin-table-row admin-table-6">
                <span className="admin-muted">{option.id}</span>
                <span>
                  <strong>{option.name || "Unnamed option"}</strong>
                  <span className="admin-muted admin-ellipsis">{option.imageUrl || "-"}</span>
                </span>
                <span>{serviceMap.get(String(option.serviceId))?.title || `Service ${option.serviceId}`}</span>
                <span>Rs {option.price || 0}</span>
                <span>{option.durationMinutes ? `${option.durationMinutes} min` : "-"}</span>
                <span className="admin-actions">
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => openEditModal(option)}
                  >
                    Edit
                  </button>
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={() => handleDelete(option)}
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
              <h3>{editingItem ? "Edit Service Option" : "Add Service Option"}</h3>
              <button className="admin-btn admin-btn-ghost" onClick={closeModal}>
                Close
              </button>
            </div>

            <div className="admin-modal-body admin-modal-form-grid">
              <select
                value={form.serviceId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, serviceId: event.target.value }))
                }
              >
                <option value="">Select service</option>
                {services.map((service) => (
                  <option key={service.id} value={String(service.id)}>
                    {service.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Option name"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
                value={form.price}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, price: event.target.value }))
                }
              />
              <input
                type="number"
                min="0"
                placeholder="Duration in minutes"
                value={form.durationMinutes}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, durationMinutes: event.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={form.imageUrl}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, imageUrl: event.target.value }))
                }
              />
              <AdminFileInput
                inputKey={`service-option-upload-${fileInputKey}`}
                label="Upload option image"
                onChange={handleUpload}
              />
            </div>

            {uploading ? <p className="admin-muted">Uploading image...</p> : null}
            {uploadError ? <p className="admin-error">{uploadError}</p> : null}

            <div className="admin-actions admin-modal-actions-end">
              <button className="admin-btn admin-btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? "Saving..." : editingItem ? "Save Changes" : "Create Option"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
