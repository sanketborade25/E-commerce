import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminFileInput from "../../components/admin/AdminFileInput";
import { notifyAdminDataChanged } from "./adminUtils";

const emptyForm = { name: "", parentCategoryId: "", imageUrl: "" };

export default function AdminSubcategories() {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [String(category.id), category])),
    [categories]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [subcategoriesRes, categoriesRes] = await Promise.all([
        api.getSubCategories(),
        api.getCategories()
      ]);
      setSubcategories(Array.isArray(subcategoriesRes) ? subcategoriesRes : []);
      setCategories(
        Array.isArray(categoriesRes)
          ? categoriesRes.filter((category) => category.parentCategoryId == null)
          : []
      );
    } catch {
      setSubcategories([]);
      setCategories([]);
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

  const openEditModal = (subcategory) => {
    setEditingItem(subcategory);
    setForm({
      name: subcategory?.name || "",
      parentCategoryId: subcategory?.parentCategoryId ? String(subcategory.parentCategoryId) : "",
      imageUrl: subcategory?.imageUrl || ""
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
    const name = form.name.trim();
    const parentCategoryId = Number(form.parentCategoryId);
    if (!name || !parentCategoryId) return;

    setSaving(true);
    try {
      const payload = {
        name,
        imageUrl: form.imageUrl || null,
        parentCategoryId
      };

      if (editingItem?.id) {
        await api.updateSubCategory(editingItem.id, payload);
      } else {
        await api.createSubCategory(payload);
      }

      closeModal();
      await loadData();
      notifyAdminDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subcategory) => {
    const ok = window.confirm(`Delete ${subcategory?.name || "this subcategory"}?`);
    if (!ok) return;
    await api.deleteSubCategory(subcategory.id);
    await loadData();
    notifyAdminDataChanged();
  };

  return (
    <AdminLayout
      title="Subcategories"
      subtitle="Keep nested category structure organized with a dedicated management page."
      actions={
        <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
          Add Subcategory
        </button>
      }
    >
      <div className="admin-card">
        {loading ? (
          <p className="admin-muted">Loading subcategories...</p>
        ) : subcategories.length === 0 ? (
          <p className="admin-muted">No subcategories found.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-row admin-table-head admin-table-5">
              <span>Name</span>
              <span>Parent Category</span>
              <span>Image</span>
              <span>ID</span>
              <span>Actions</span>
            </div>
            {subcategories.map((subcategory) => (
              <div key={subcategory.id} className="admin-table-row admin-table-5">
                <span>
                  <strong>{subcategory.name}</strong>
                </span>
                <span>{categoryMap.get(String(subcategory.parentCategoryId))?.name || "-"}</span>
                <span className="admin-muted admin-ellipsis">{subcategory.imageUrl || "-"}</span>
                <span className="admin-muted">{subcategory.id}</span>
                <span className="admin-actions">
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => openEditModal(subcategory)}
                  >
                    Edit
                  </button>
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={() => handleDelete(subcategory)}
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
              <h3>{editingItem ? "Edit Subcategory" : "Add Subcategory"}</h3>
              <button className="admin-btn admin-btn-ghost" onClick={closeModal}>
                Close
              </button>
            </div>

            <div className="admin-modal-body admin-modal-form-grid">
              <input
                type="text"
                placeholder="Subcategory name"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              <select
                value={form.parentCategoryId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, parentCategoryId: event.target.value }))
                }
              >
                <option value="">Select parent category</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={form.imageUrl}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, imageUrl: event.target.value }))
                }
              />
              <AdminFileInput
                inputKey={`subcategory-upload-${fileInputKey}`}
                label="Upload subcategory image"
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
                {saving ? "Saving..." : editingItem ? "Save Changes" : "Create Subcategory"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
