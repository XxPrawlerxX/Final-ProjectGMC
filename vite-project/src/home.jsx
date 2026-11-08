import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { discountPercent, formatNaira } from "./lib/format";
import { useApi } from "./useApi";
import { useCart } from "./useCart";
import { useToast } from "./toast/toastContext";
import Layout from "./Layout";
import ProductCard from "./ProductCard";
import RecommendationSections from "./RecommendationSections";
import ScrollRow from "./ScrollRow";
import "./cards.css";
import "./home.css";

function Hero({ slides }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const toast = useToast();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || reduceMotion || slides.length < 2) return undefined;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const slide = slides[index % slides.length];
  const discount = discountPercent(slide.price, slide.oldPrice);

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Featured products"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="hero-copy">
        {discount > 0 && <span className="hero-badge">{discount}% off</span>}
        <p className="hero-category">{slide.category}</p>
        <h1>{slide.name}</h1>
        <p className="hero-text">{slide.description}</p>
        <p className="hero-price">
          <strong>{formatNaira(slide.price)}</strong>
          {discount > 0 && <del>{formatNaira(slide.oldPrice)}</del>}
        </p>
        <div className="hero-buttons">
          <button className="hero-primary" onClick={() => navigate(`/product/${slide.id}`)}>
            Shop now <ArrowRight size={17} />
          </button>
          <button
            className="hero-secondary"
            onClick={() => {
              addToCart(slide);
              toast(`${slide.name} added to cart`, { to: "/cart", label: "View cart" });
            }}
          >
            Add to cart
          </button>
        </div>
        {slides.length > 1 && (
          <div className="hero-dots">
            {slides.map((item, i) => (
              <button
                key={item.id}
                className={i === index ? "active" : ""}
                onClick={() => setIndex(i)}
                aria-label={`Show ${item.name}`}
                aria-current={i === index}
              />
            ))}
          </div>
        )}
      </div>

      <Link className="hero-image" to={`/product/${slide.id}`} tabIndex={-1} aria-hidden="true">
        <img src={slide.image} alt="" />
      </Link>
    </section>
  );
}

function Loading() {
  return (
    <div className="site-container home-loading" role="status" aria-label="Loading">
      <div className="skeleton hero-skeleton" />
      <div className="skeleton tiles-skeleton" />
      <div className="pgrid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { data, error, loading, reload } = useApi("/api/home");

  return (
    <Layout>
      {loading && <Loading />}

      {error && (
        <div className="site-container home-error">
          <h1>We couldn&apos;t load the store</h1>
          <p>{error.message}</p>
          <button onClick={reload}>Try again</button>
        </div>
      )}

      {data && (
        <>
          {data.hero.length > 0 && (
            <div className="site-container">
              <Hero slides={data.hero} />
            </div>
          )}

          {data.tiles.length > 0 && (
            <section className="site-container home-section" aria-labelledby="shop-by-category">
              <div className="home-heading">
                <h2 id="shop-by-category">Shop by category</h2>
              </div>
              <ul className="tiles">
                {data.tiles.map((tile) => (
                  <li key={tile.slug}>
                    <Link to={`/category/${tile.slug}`}>
                      <span className="tile-image">
                        <img src={tile.image} alt="" loading="lazy" />
                      </span>
                      <span className="tile-name">{tile.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.recommended && <RecommendationSections sections={[{ ...data.recommended }]} />}

          {data.latest.length > 0 && (
            <section className="site-container home-section" aria-labelledby="row-latest">
              <div className="home-heading">
                <div>
                  <h2 id="row-latest">New arrivals</h2>
                  <p>Fresh from our sellers</p>
                </div>
              </div>
              <ScrollRow label="New arrivals">
                {data.latest.map((product) => (
                  <div className="scrollrow-item" role="listitem" key={product.id}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </ScrollRow>
            </section>
          )}

          {data.collections.slice(0, data.recommended || data.latest.length > 0 ? 2 : 4).map((row) => (
            <section key={row.slug} className="site-container home-section" aria-labelledby={`row-${row.slug}`}>
              <div className="home-heading">
                <div>
                  <h2 id={`row-${row.slug}`}>{row.title}</h2>
                  {row.subtitle && <p>{row.subtitle}</p>}
                </div>
                {row.category && (
                  <Link className="home-see-all" to={`/category/${row.category}`}>
                    See all <ChevronRight size={16} />
                  </Link>
                )}
              </div>
              <ScrollRow label={row.title}>
                {row.products.map((product) => (
                  <div className="scrollrow-item" role="listitem" key={product.id}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </ScrollRow>
            </section>
          ))}
        </>
      )}
    </Layout>
  );
}
