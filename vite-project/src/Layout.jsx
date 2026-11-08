import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

// Standard page frame: header, content, footer.
export default function Layout({ children, activeCategory, className = "" }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader activeCategory={activeCategory} />
      <main id="main" className={`site-main ${className}`}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
