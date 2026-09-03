import { useState } from "react";

function Navbar({
  shopName = "Jessi Market",
  menuItems = [
    "Home",
    "New In",
    "Women",
    "Men",
    "Home Essentials",
    "Beauty",
    "Deals",
  ],
  categories = ["All Categories", "Fashion", "Home", "Beauty", "Gadgets"],
  searchPlaceholder = "Search products, brands, and essentials...",
  accountLabel = "My Account",
  cartLabel = "My Cart",
  ordersLabel = "My Orders",
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navLinks = menuItems.map((item, index) => ({
    id: `${item.toLowerCase().replace(/\s+/g, "-")}-${index}`,
    label: item,
  }));

  const utilityLinks = [
    { label: accountLabel, icon: "👤" },
    { label: cartLabel, icon: "🛒" },
    { label: ordersLabel, icon: "📦" },
  ];

  return (
    <>
      <header className="topbar">
        <div className="navbar">
          <div className="brand-block" aria-label="Store brand">
            <div className="brand-icon">M</div>
            <span className="brand-name">{shopName}</span>
          </div>

          <button
            type="button"
            className="menu-toggle"
            aria-label="Open menu"
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="search-area" role="search">
            <label className="search-select" htmlFor="category-select">
              <select id="category-select" name="category">
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <input
              type="text"
              className="search-input"
              placeholder={searchPlaceholder}
              aria-label="Search products"
            />

            <button type="button" className="search-button">
              Search
            </button>
          </div>

          <div className="utility-links" aria-label="Account actions">
            {utilityLinks.map((item) => (
              <a key={item.label} href="#" className="utility-link">
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </header>

      <aside
        className={`side-drawer ${isSidebarOpen ? "open" : ""}`}
        aria-label="Sidebar navigation"
      >
        <div className="drawer-header">
          <h2>Explore</h2>
          <button
            type="button"
            className="close-button"
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="drawer-section">
          <p>Browse categories</p>
          <ul>
            {navLinks.map((item) => (
              <li key={item.id}>
                <a href="#" onClick={() => setIsSidebarOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="drawer-section drawer-actions">
          {utilityLinks.map((item) => (
            <a key={item.label} href="#" className="drawer-action">
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </div>
      </aside>
    </>
  );
}

export default Navbar;
