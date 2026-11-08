import { Link } from "react-router-dom";
import { BadgeCheck, ChevronRight, Store } from "lucide-react";
import ProductCard from "./ProductCard";
import ScrollRow from "./ScrollRow";
import "./cards.css";
import "./home.css";

// Rows of picks (products, or wholesale suppliers) built for the shopper's mode.
export default function RecommendationSections({ sections }) {
  return sections.map((section) => (
    <section key={section.key} className="home-section rec-section" aria-labelledby={`rec-${section.key}`}>
      <div className="home-heading">
        <div>
          <h2 id={`rec-${section.key}`}>{section.title}</h2>
          {section.subtitle && <p>{section.subtitle}</p>}
        </div>
        {section.link && (
          <Link className="home-see-all" to={section.link}>
            See all <ChevronRight size={16} />
          </Link>
        )}
      </div>

      {section.products && (
        <ScrollRow label={section.title}>
          {section.products.map((product) => (
            <div className="scrollrow-item" role="listitem" key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </ScrollRow>
      )}

      {section.suppliers && (
        <ul className="supplier-grid">
          {section.suppliers.map((s) => (
            <li key={s.slug}>
              <Link to={`/store/${s.slug}`}>
                <span className="supplier-icon"><Store size={22} /></span>
                <span className="supplier-text">
                  <strong>{s.name} {s.verified && <BadgeCheck size={15} className="verified-icon" aria-label="Verified" />}</strong>
                  <span>{s.city}, {s.state}</span>
                  <em>{s.productCount} {s.productCount === 1 ? "listing" : "listings"}</em>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  ));
}
