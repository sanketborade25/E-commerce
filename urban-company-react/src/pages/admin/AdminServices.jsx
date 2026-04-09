import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminFileInput from "../../components/admin/AdminFileInput";
import { notifyAdminDataChanged } from "./adminUtils";

const emptyForm = {
  title: "",
  categoryId: "",
  subCategoryId: "",
  cityId: "",
  imageUrl: "",
  serviceBanner: "",
  isActive: true
};

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [String(category.id), category])),
    [categories]
  );
  const subcategoryMap = useMemo(
    () => new Map(subcategories.map((subcategory) => [String(subcategory.id), subcategory])),
    [subcategories]
  );
  const cityMap = useMemo(() => new Map(cities.map((city) => [String(city.id), city])), [cities]);

  const availableSubcategories = useMemo(() => {
    if (!form.categoryId) return [];
    return subcategories.filter(
      (subcategory) => String(subcategory.parentCategoryId) === String(form.categoryId)
    );
  }, [form.categoryId, subcategories]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesRes, categoriesRes, subcategoriesRes, citiesRes] = await Promise.all([
        api.getAdminServices(),
        api.getCategories(),
        api.getSubCategories(),
        api.getCities({ includeInactive: true })
      ]);
      setServices(Array.isArray(servicesRes) ? servicesRes : []);
      setCategories(
        Array.isArray(categoriesRes)
          ? categoriesRes.filter((category) => category.parentCategoryId == null)
          : []
      );
      setSubcategories(Array.isArray(subcategoriesRes) ? subcategoriesRes : []);
      setCities(Array.isArray(citiesRes) ? citiesRes : []);
    } catch {
      setServices([]);
      setCategories([]);
      setSubcategories([]);
      setCities([]);
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
    setUploadingField("");
  };

  const openAddModal = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setUploadError("");
    setFileInputKey((key) => key + 1);
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingItem(service);
    setForm({
      title: service?.title || "",
      categoryId: service?.categoryId ? String(service.categoryId) : "",
      subCategoryId: service?.subCategoryId ? String(service.subCategoryId) : "",
      cityId: service?.cityId ? String(service.cityId) : "",
      imageUrl: service?.imageUrl || "",
      serviceBanner: service?.bannerImageUrl || "",
      isActive: Boolean(service?.isActive)
    });
    setUploadError("");
    setFileInputKey((key) => key + 1);
    setShowModal(true);
  };

  const handleUpload = async (field, file) => {
    if (!file) return;
    setUploadingField(field);
    setUploadError("");
    try {
      const res = await api.uploadImage(file);
      if (res?.url) {
        setForm((prev) => ({ ...prev, [field]: res.url }));
      }
    } catch (error) {
      setUploadError(error?.message || "Upload failed.");
    } finally {
      setUploadingField("");
    }
  };

  const handleCategoryChange = (categoryId) => {
    setForm((prev) => ({
      ...prev,
      categoryId,
      subCategoryId:
        subcategories.some(
          (subcategory) =>
            String(subcategory.id) === String(prev.subCategoryId) &&
            String(subcategory.parentCategoryId) === String(categoryId)
        )
          ? prev.subCategoryId
          : ""
    }));
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const categoryId = Number(form.categoryId);
    const subCategoryId = Number(form.subCategoryId);
    if (!title || !categoryId || !subCategoryId) return;

    setSaving(true);
    try {
      const payload = {
        title,
        categoryId,
        subCategoryId,
        cityId: form.cityId ? Number(form.cityId) : null,
        imageUrl: form.imageUrl || null,
        bannerImageUrl: form.serviceBanner || null,
        isActive: Boolean(form.isActive)
      };

      if (editingItem?.id) {
        await api.updateService(editingItem.id, payload);
      } else {
        await api.createService(payload);
      }

      closeModal();
      await loadData();
      notifyAdminDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service) => {
    const ok = window.confirm(`Delete ${service?.title || "this service"}?`);
    if (!ok) return;
    await api.deleteService(service.id);
    await loadData();
    notifyAdminDataChanged();
  };

  const openImagePreview = (imageUrl) => {
    if (!imageUrl) return;
    window.open(imageUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <AdminLayout
      title="Services"
      subtitle="Manage service catalog entries on a focused page with clear relationships."
      actions={
        <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
          Add Service
        </button>
      }
    >
      <div className="admin-card">
        {loading ? (
          <p className="admin-muted">Loading services...</p>
        ) : services.length === 0 ? (
          <p className="admin-muted">No services found.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-row admin-table-head admin-table-service">
              <span>ID</span>
              <span>Image</span>
              <span>Title</span>
              <span>Category</span>
              <span>Subcategory</span>
              <span>City</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {services.map((service) => (
              <div key={service.id} className="admin-table-row admin-table-service">
                <span className="admin-muted">{service.id}</span>
                <span>
                  {service.imageUrl ? (
                    <button
                      type="button"
                      className="admin-image-button"
                      onClick={() => openImagePreview(service.imageUrl)}
                      title="Open full image"
                    >
                      <img
                        src={service.imageUrl}
                        alt={service.title || "Service"}
                        className="admin-thumbnail"
                      />
                    </button>
                  ) : (
                    <span className="admin-thumbnail admin-thumbnail-placeholder">No image</span>
                  )}
                </span>
                <span>
                  <strong>{service.title}</strong>
                  <span className="admin-muted">
                    {Array.isArray(service.cityStatuses) ? service.cityStatuses.length : 0} city
                    {Array.isArray(service.cityStatuses) && service.cityStatuses.length === 1
                      ? ""
                      : "ies"}
                  </span>
                </span>
                <span>{categoryMap.get(String(service.categoryId))?.name || "-"}</span>
                <span>{subcategoryMap.get(String(service.subCategoryId))?.name || "-"}</span>
                <span>{cityMap.get(String(service.cityId))?.name || "All / mapped"}</span>
                <span
                  className={`admin-status-badge ${
                    service.isActive ? "is-success" : "is-danger"
                  }`}
                >
                  {service.isActive ? "Active" : "Inactive"}
                </span>
                <span className="admin-actions">
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => openEditModal(service)}
                  >
                    Edit
                  </button>
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={() => handleDelete(service)}
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
              <h3>{editingItem ? "Edit Service" : "Add Service"}</h3>
              <button className="admin-btn admin-btn-ghost" onClick={closeModal}>
                Close
              </button>
            </div>

            <div className="admin-modal-body admin-modal-form-grid">
              <input
                type="text"
                placeholder="Service title"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
              />
              <select
                value={form.categoryId}
                onChange={(event) => handleCategoryChange(event.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={form.subCategoryId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subCategoryId: event.target.value }))
                }
              >
                <option value="">Select subcategory</option>
                {availableSubcategories.map((subcategory) => (
                  <option key={subcategory.id} value={String(subcategory.id)}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
              <select
                value={form.cityId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, cityId: event.target.value }))
                }
              >
                <option value="">No default city</option>
                {cities.map((city) => (
                  <option key={city.id} value={String(city.id)}>
                    {city.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Card image URL (optional)"
                value={form.imageUrl}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, imageUrl: event.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Service banner URL (optional)"
                value={form.serviceBanner}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, serviceBanner: event.target.value }))
                }
              />
              <select
                value={form.isActive ? "true" : "false"}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isActive: event.target.value === "true" }))
                }
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <AdminFileInput
                inputKey={`service-image-${fileInputKey}`}
                label="Upload service image"
                onChange={(file) => handleUpload("imageUrl", file)}
              />
              <AdminFileInput
                inputKey={`service-banner-${fileInputKey}`}
                label="Upload service banner"
                onChange={(file) => handleUpload("serviceBanner", file)}
              />
            </div>

            {uploadingField ? <p className="admin-muted">Uploading image...</p> : null}
            {uploadError ? <p className="admin-error">{uploadError}</p> : null}

            <div className="admin-actions admin-modal-actions-end">
              <button className="admin-btn admin-btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? "Saving..." : editingItem ? "Save Changes" : "Create Service"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
