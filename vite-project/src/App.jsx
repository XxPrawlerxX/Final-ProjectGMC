import { Route, Routes } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import CartProvider from "./CartProvider";
import WishlistProvider from "./wishlist/WishlistProvider";
import ToastProvider from "./toast/ToastProvider";
import ProtectedRoute from "./ProtectedRoute";
import ScrollToTop from "./ScrollToTop";
import Home from "./home";
import CategoryPage from "./CategoryPage";
import ProductPage from "./ProductPage";
import SearchPage from "./SearchPage";
import Cart from "./cart";
import Checkout from "./checkout";
import OrderConfirmation from "./OrderConfirmation";
import SignIn from "./SignIn";
import Register from "./Register";
import Account from "./Account";
import SellerDashboard from "./SellerDashboard";
import ProductForm from "./ProductForm";
import StorePage from "./StorePage";
import Messages from "./Messages";
import Browse from "./Browse";
import NotFound from "./NotFound";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <WishlistProvider>
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
              <Route path="/register" element={<Register />} />
              <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
              <Route path="/sell" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
              <Route path="/sell/register" element={<Register initialRole="sell" />} />
              <Route path="/sell/products/new" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
              <Route path="/sell/products/:slug/edit" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
              <Route path="/store/:slug" element={<StorePage />} />
              <Route path="/wholesale" element={<Browse kind="wholesale" />} />
              <Route path="/preloved" element={<Browse kind="preloved" />} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/messages/:id" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </WishlistProvider>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
