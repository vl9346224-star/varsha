import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authService } from "../services/authService.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [loading, setLoading] = useState(!!localStorage.getItem("token"));

  const persist = (token, u) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // Re-validate session on page load
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    authService
      .me()
      .then((u) => { localStorage.setItem("user", JSON.stringify(u)); setUser(u); })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const login = async (creds) => {
    const { token, user } = await authService.login(creds);
    persist(token, user);
    return user;
  };
  const register = async (data) => {
    const { token, user } = await authService.register(data);
    persist(token, user);
    return user;
  };
  const updateProfile = async (data) => {
    const u = await authService.updateProfile(data);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    return u;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthed: !!user, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
