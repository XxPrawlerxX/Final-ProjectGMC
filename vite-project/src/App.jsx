import { Route, Routes } from "react-router-dom";
import CartProvider from "./CartProvider";
import ScrollToTop from "./ScrollToTop";
import Home from "./home";
import CategoryPage from "./CategoryPage";
import ProductPage from "./ProductPage";
import SearchPage from "./SearchPage";
import Cart from "./cart";
import Checkout from "./checkout";
import OrderConfirmation from "./OrderConfirmation";
import SignIn from "./SignIn";
import NotFound from "./NotFound";

export default function App() {
  return (
    <CartProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/product/:productId" element={<ProductPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </CartProvider>
  );
}
