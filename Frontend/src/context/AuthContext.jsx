import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/authApi";
import { getToken, setToken, clearToken, ApiError } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Starts true so the app doesn't briefly render a "logged out" page
  // before we've had a chance to check for an existing token.
  const [loading, setLoading] = useState(true);

  // Restore the session on first load: if a token is already saved,
  // ask the backend who it belongs to. If the token is invalid/expired,
  // the backend rejects it and we simply treat the user as logged out.
  useEffect(() => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .getCurrentUser()
      .then((data) => setUser(data.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const data = await authApi.login(credentials);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function registerCustomer(payload) {
    await authApi.registerCustomer(payload);
    // Registration doesn't log the user in automatically on the backend
    // (no token is issued) — sign them in right after for a smooth flow.
    return login({ email: payload.email, password: payload.password });
  }

  async function registerVendor(payload) {
    // A vendor application does NOT grant the "vendor" role immediately
    // (it starts "pending" until an admin approves it), but the account
    // itself is created, so we can still sign the customer in.
    const data = await authApi.registerVendor(payload);
    await login({ email: payload.email, password: payload.password });
    return data;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  // Updates name/email, then refreshes local user state so things like
  // the header's "Hi, {name}" reflect the change immediately.
  async function updateProfile(payload) {
    const data = await authApi.updateProfile(payload);
    setUser(data.user);
    return data.user;
  }

  const value = {
    user,
    isAuthenticated: Boolean(user),
    role: user?.role || null,
    loading,
    login,
    registerCustomer,
    registerVendor,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}

export { ApiError };
