import { useEffect, useState } from "react";
import { api } from "../../api/client";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminFileInput from "../../components/admin/AdminFileInput";
import { notifyAdminDataChanged } from "./adminUtils";

const emptyForm = { name: "", imageUrl: "" };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.getCategories();
      setCategories((res || []).filter((c) => c.parentCategoryId == null));
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setUploadError("");
    setFileInputKey((k) => k + 1);
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setForm({
      name: category?.name || "",
      imageUrl: category?.imageUrl || ""
    });
    setUploadError("");
    setFileInputKey((k) => k + 1);
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
    } catch (e) {
      setUploadError(e?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) return;

    setSaving(true);
    try {
      if (editingCategory?.id) {
        await api.updateCategory(editingCategory.id, {
          name,
          imageUrl: form.imageUrl || null
        });
      } else {
        await api.createCategory({
          name,
          imageUrl: form.imageUrl || null
        });
      }
      setShowModal(false);
      await loadCategories();
      notifyAdminDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const ok = window.confirm(`Delete ${category?.name || "this category"}?`);
    if (!ok) return;
    await api.deleteCategory(category.id);
    await loadCategories();
    notifyAdminDataChanged();
  };

  return (
    <AdminLayout
      title="Categories"
      subtitle="Manage top-level categories in a dedicated module page."
      actions={
        <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
          Add Category
        </button>
      }
    >
      <div className="admin-card">
        {loading ? (
          <p className="admin-muted">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="admin-muted">No categories found.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-row admin-table-head admin-table-4">
              <span>Name</span>
              <span>Image</span>
              <span>ID</span>
              <span>Actions</span>
            </div>
            {categories.map((category) => (
              <div key={category.id} className="admin-table-row admin-table-4">
                <span>
                  <strong>{category.name}</strong>
                </span>
                <span className="admin-muted admin-ellipsis">{category.imageUrl || "-"}</span>
                <span className="admin-muted">{category.id}</span>
                <span className="admin-actions">
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => openEditModal(category)}
                  >
                    Edit
                  </button>
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={() => handleDelete(category)}
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
        <div className="admin-modal" onClick={() => setShowModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingCategory ? "Edit Category" : "Add Category"}</h3>
              <button className="admin-btn admin-btn-ghost" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>

            <div className="admin-modal-body admin-modal-form-grid">
              <input
                type="text"
                placeholder="Category name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
              />
              <AdminFileInput
                inputKey={`category-upload-${fileInputKey}`}
                label="Upload category image"
                onChange={handleUpload}
              />
            </div>

            {uploading ? <p className="admin-muted">Uploading image...</p> : null}
            {uploadError ? <p className="admin-error">{uploadError}</p> : null}

            <div className="admin-actions admin-modal-actions-end">
              <button className="admin-btn admin-btn-ghost" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? "Saving..." : editingCategory ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
