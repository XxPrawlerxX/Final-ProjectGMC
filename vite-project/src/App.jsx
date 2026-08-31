import { useState } from "react";
import CategoryPage from "./CategoryPage";
import Home from "./home";
import SignIn from "./SignIn";
import Cart from "./cart";
import Checkout from "./checkout";
import { categoryFromSlug } from "./categoryData";

export default function App() {
  const [page, setPage] = useState({ type: "home" });

  // CART
  const [cart, setCart] = useState([]);

  function addToCart(product) {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.name === product.name,
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          item.name === product.name
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  }

  function removeFromCart(productName) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.name !== productName),
    );
  }

  function updateQuantity(productName, quantity) {
    if (quantity < 1) {
      removeFromCart(productName);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.name === productName
          ? {
              ...item,
              quantity,
            }
          : item,
      ),
    );
  }

  function openCategory(slug) {
    setPage({
      type: "category",
      slug,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
if (page.type === "checkout") {
  return (
    <Checkout
      cart={cart}
      onBack={() => setPage({ type: "cart" })}
      onPlaceOrder={() => window.alert("Order placed successfully!")}
    />
  );
}
  if (page.type === "cart") {
    return (
      <Cart
        cart={cart}
        onBack={() => setPage({ type: "home" })}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        onCheckout={() => setPage({ type: "checkout" })}
      />
    );
  }
  // SIGN IN
  if (page.type === "signin") {
    return (
      <SignIn
        onBack={() => setPage({ type: "home" })}
        onRegister={() => window.alert("Register page coming soon")}
      />
    );
  }

  // CATEGORY PAGE
  if (page.type === "category") {
    return (
      <CategoryPage
        category={categoryFromSlug(page.slug)}
        onBack={() => setPage({ type: "home" })}
        onCategorySelect={openCategory}
        cart={cart}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
      />
    );
  }

  // HOME PAGE
  return (
    <Home
      onSignIn={() => setPage({ type: "signin" })}
      onCategorySelect={openCategory}
      onCart={() => setPage({ type: "cart" })}
      cart={cart}
      addToCart={addToCart}
    />
  );
}
