import "./App.css";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Navbar
      shopName="Mira Market"
      menuItems={[
        "Home",
        "New In",
        "Women",
        "Men",
        "Home Essentials",
        "Beauty",
        "Deals",
      ]}
      categories={["All Categories", "Fashion", "Home", "Beauty", "Gadgets"]}
      searchPlaceholder="Search products, brands, and essentials..."
      accountLabel="My Account"
      cartLabel="My Cart"
      ordersLabel="My Orders"
    />
  );
}

export default App;
