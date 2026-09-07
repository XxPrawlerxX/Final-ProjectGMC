import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { getProductReviews, createReview } from "../api/reviewApi";
import { useAuth } from "../context/AuthContext";

// No review UI existed before this — reuses the same form/button
// classes as the rest of the site (form-group, place-order-button,
// signin-form-message) rather than a new visual style.
export default function ProductReviews({ productId }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    getProductReviews(productId)
      .then(setReviews)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate("/signin", { state: { from: `/product/${productId}` } });
      return;
    }

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      // The backend is the one that actually verifies this was a real,
      // delivered purchase — this form doesn't (and can't) pre-check
      // that itself, it just surfaces whatever the backend decides.
      await createReview({ productId, rating, comment });
      setComment("");
      setFormSuccess("Thanks for your review!");
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="product-reviews-section">
      <h2>Customer Reviews</h2>

      {loading && <p>Loading reviews…</p>}

      {!loading && reviews.length === 0 && (
        <p className="product-reviews-empty">No reviews yet — be the first to review this product.</p>
      )}

      <div className="product-reviews-list">
        {reviews.map((review) => (
          <div className="product-review-item" key={review._id}>
            <div className="product-review-header">
              <div className="product-review-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    fill={star <= review.rating ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <strong>{review.user?.name || "Anonymous"}</strong>
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
            {review.comment && <p>{review.comment}</p>}
          </div>
        ))}
      </div>

      <form className="product-review-form" onSubmit={handleSubmit}>
        <h3>Write a Review</h3>

        <div className="form-group">
          <label>Your rating</label>
          <div className="product-review-star-picker">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} stars`}
              >
                <Star size={22} fill={star <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="review-comment">Your review (optional)</label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="What did you think of this product?"
          />
        </div>

        {formError && <p className="signin-form-message">{formError}</p>}
        {formSuccess && <p className="product-review-success">{formSuccess}</p>}

        <button className="place-order-button" type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : isAuthenticated ? "Submit Review" : "Sign in to Review"}
        </button>

        {isAuthenticated && (
          <p className="product-reviews-note">
            Reviews can only be left on products you've purchased and received.
          </p>
        )}
      </form>
    </section>
  );
}
