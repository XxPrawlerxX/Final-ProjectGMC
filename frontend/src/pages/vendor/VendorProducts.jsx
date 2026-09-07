import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../api/productApi";
import { getCategories } from "../../api/categoryApi";
import { formatNaira } from "../../categoryUtils";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  oldPrice: "",
  image: "",
  category: "",
  stock: "",
  tag: "",
  shipping: "",
};

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadProducts() {
    setLoading(true);
    getMyProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProducts();
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  function openCreateForm() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(product) {
    setEditingId(product._id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      oldPrice: product.oldPrice || "",
      image: product.image,
      category: product.category?._id || "",
      stock: product.stock,
      tag: product.tag || "",
      shipping: product.shipping || "",
    });
    setFormError("");
    setShowForm(true);
  }

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const { name, description, price, image, category, stock } = formData;

    if (!name || !description || !price || !image || !category || stock === "") {
      setFormError("Name, description, price, image, category and stock are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    // Only ever send fields the backend actually accepts — vendor/id are
    // never part of this payload, the backend determines those itself.
    const payload = {
      name,
      description,
      price: Number(price),
      oldPrice: formData.oldPrice ? Number(formData.oldPrice) : undefined,
      image,
      category,
      stock: Number(stock),
      tag: formData.tag || undefined,
      shipping: formData.shipping || undefined,
    };

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }

      setShowForm(false);
      loadProducts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteProduct(product._id);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="vendor-panel">
      <div className="vendor-panel-header">
        <h2>My Products</h2>
        <button className="vendor-primary-button" onClick={openCreateForm}>
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {showForm && (
        <form className="vendor-product-form" onSubmit={handleSubmit}>
          <h3>{editingId ? "Edit Product" : "New Product"}</h3>

          <div className="vendor-form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => updateField("category", e.target.value)}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>

          <div className="vendor-form-row">
            <div className="form-group">
              <label>Price (₦)</label>
              <input
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => updateField("price", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Old Price (₦, optional)</label>
              <input
                type="number"
                min="0"
                value={formData.oldPrice}
                onChange={(e) => updateField("oldPrice", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => updateField("stock", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input
              value={formData.image}
              onChange={(e) => updateField("image", e.target.value)}
            />
          </div>

          <div className="vendor-form-row">
            <div className="form-group">
              <label>Tag (optional)</label>
              <input
                value={formData.tag}
                onChange={(e) => updateField("tag", e.target.value)}
                placeholder="e.g. New"
              />
            </div>

            <div className="form-group">
              <label>Shipping note (optional)</label>
              <input
                value={formData.shipping}
                onChange={(e) => updateField("shipping", e.target.value)}
                placeholder="e.g. Free delivery"
              />
            </div>
          </div>

          {formError && <p className="signin-form-message">{formError}</p>}

          <div className="vendor-form-actions">
            <button type="submit" className="vendor-primary-button" disabled={submitting}>
              {submitting ? "Saving…" : editingId ? "Save Changes" : "Create Product"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p>Loading your products…</p>}
      {error && <p className="signin-form-message">{error}</p>}

      {!loading && products.length === 0 && (
        <p>You haven't listed any products yet.</p>
      )}

      <div className="vendor-product-list">
        {products.map((product) => (
          <div className="vendor-product-row" key={product._id}>
            <img src={product.image} alt={product.name} />

            <div className="vendor-product-row-info">
              <strong>{product.name}</strong>
              <span>
                {formatNaira(product.price)} • {product.stock} in stock
                {!product.isActive && " • Inactive"}
              </span>
            </div>

            <div className="vendor-product-row-actions">
              <button onClick={() => openEditForm(product)} aria-label={`Edit ${product.name}`}>
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(product)} aria-label={`Delete ${product.name}`}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
