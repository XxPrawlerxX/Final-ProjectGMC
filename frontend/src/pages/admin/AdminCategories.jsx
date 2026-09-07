import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/categoryApi";

const EMPTY_FORM = { name: "", slug: "", image: "" };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    getCategories()
      .then(setCategories)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreateForm() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(category) {
    setEditingId(category._id);
    setFormData({ name: category.name, slug: category.slug, image: category.image || "" });
    setFormError("");
    setShowForm(true);
  }

  // Auto-suggest a URL-safe slug from the name, but leave it editable —
  // admins may want a specific slug independent of the display name.
  function updateName(name) {
    setFormData((current) => ({
      ...current,
      name,
      slug: editingId
        ? current.slug
        : name
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.name || !formData.slug) {
      setFormError("Name and slug are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      if (editingId) {
        await updateCategory(editingId, formData);
      } else {
        await createCategory(formData);
      }

      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(category) {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;

    try {
      await deleteCategory(category._id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="vendor-panel">
      <div className="vendor-panel-header">
        <h2>Categories</h2>
        <button className="vendor-primary-button" onClick={openCreateForm}>
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {showForm && (
        <form className="vendor-product-form" onSubmit={handleSubmit}>
          <h3>{editingId ? "Edit Category" : "New Category"}</h3>

          <div className="vendor-form-row">
            <div className="form-group">
              <label>Name</label>
              <input value={formData.name} onChange={(e) => updateName(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Slug</label>
              <input
                value={formData.slug}
                onChange={(e) => setFormData((c) => ({ ...c, slug: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input
              value={formData.image}
              onChange={(e) => setFormData((c) => ({ ...c, image: e.target.value }))}
            />
          </div>

          {formError && <p className="signin-form-message">{formError}</p>}

          <div className="vendor-form-actions">
            <button type="submit" className="vendor-primary-button" disabled={submitting}>
              {submitting ? "Saving…" : editingId ? "Save Changes" : "Create Category"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p>Loading categories…</p>}
      {error && <p className="signin-form-message">{error}</p>}

      <div className="vendor-product-list">
        {categories.map((category) => (
          <div className="vendor-product-row" key={category._id}>
            {category.image && <img src={category.image} alt={category.name} />}

            <div className="vendor-product-row-info">
              <strong>{category.name}</strong>
              <span>/{category.slug}</span>
            </div>

            <div className="vendor-product-row-actions">
              <button onClick={() => openEditForm(category)} aria-label={`Edit ${category.name}`}>
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(category)} aria-label={`Delete ${category.name}`}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
