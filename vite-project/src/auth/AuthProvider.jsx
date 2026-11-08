import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { AuthContext } from "./authContext";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // false until we know if someone is signed in

  useEffect(() => {
    let active = true;
    api
      .get("/api/auth/me")
      .then((data) => active && setUser(data.user))
      .catch(() => {})
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post("/api/auth/login", { email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (fields) => {
    const data = await api.post("/api/auth/register", fields);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout").catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, logout, setUser }),
    [user, ready, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
