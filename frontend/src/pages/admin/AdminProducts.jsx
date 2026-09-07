import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { getProducts, deleteProduct } from "../../api/productApi";
import { formatNaira } from "../../categoryUtils";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    // Admins see every product across every vendor — the backend
    // already lets an admin delete any product, ownership checks only
    // apply to vendors.
    getProducts({ limit: 100 })
      .then((data) => setProducts(data.products))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    try {
      await deleteProduct(product._id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="vendor-panel">
      <div className="vendor-panel-header">
        <h2>All Products</h2>
      </div>

      {loading && <p>Loading products…</p>}
      {error && <p className="signin-form-message">{error}</p>}
      {!loading && products.length === 0 && <p>No products yet.</p>}

      <div className="vendor-product-list">
        {products.map((product) => (
          <div className="vendor-product-row" key={product._id}>
            <img src={product.image} alt={product.name} />

            <div className="vendor-product-row-info">
              <strong>{product.name}</strong>
              <span>
                {formatNaira(product.price)} • {product.stock} in stock •{" "}
                {product.vendor?.storeName || "No vendor (legacy)"}
              </span>
            </div>

            <div className="vendor-product-row-actions">
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
