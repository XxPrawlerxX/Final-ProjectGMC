import { useState } from "react";
import CategoryPage from "./CategoryPage";
import Home from "./home";
import SignIn from "./SignIn";
import { categoryFromSlug } from "./categoryData";

export default function App() {
  const [page, setPage] = useState({ type: "home" });

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

  if (page.type === "signin") {
    return (
      <SignIn
        onBack={() => setPage({ type: "home" })}
        onRegister={() => window.alert("Register page coming soon")}
      />
    );
  }

  if (page.type === "category") {
    return (
      <CategoryPage
        category={categoryFromSlug(page.slug)}
        onBack={() => setPage({ type: "home" })}
        onCategorySelect={openCategory}
      />
    );
  }

  return (
    <Home
      onSignIn={() => setPage({ type: "signin" })}
      onCategorySelect={openCategory}
    />
  );
}
