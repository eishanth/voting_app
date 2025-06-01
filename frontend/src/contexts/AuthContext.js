import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { googleLogout } from "@react-oauth/google";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get("/api/auth/me");
          setUser(response.data.user);
        } catch (error) {
          console.error("Auth check failed:", error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log("Frontend login attempt:", {
        email,
        passwordLength: password.length,
      });
      const response = await axios.post("/api/auth/login", { email, password });
      console.log("Login response:", response.data);
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem("token", newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error("Frontend login error:", error.response?.data);
      const message = error.response?.data?.message || "Login failed";
      return { success: false, message };
    }
  };

  const register = async (name, email, password) => {
    try {
      console.log("Frontend register attempt:", {
        name,
        email,
        passwordLength: password.length,
      });
      const response = await axios.post("/api/auth/register", {
        name,
        email,
        password,
      });
      console.log("Register response:", response.data);
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem("token", newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error("Frontend register error:", error.response?.data);
      const message = error.response?.data?.message || "Registration failed";
      return { success: false, message };
    }
  };

  // Google login
  const loginWithGoogle = async (credential) => {
    try {
      const response = await axios.post("/api/auth/google", { credential });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error("Google login error:", error.response?.data);
      const message = error.response?.data?.message || "Google login failed";
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
    googleLogout();
  };

  const updateTheme = async (theme) => {
    try {
      await axios.put("/api/auth/theme", { theme });
      setUser((prev) => ({ ...prev, theme }));
      return true;
    } catch (error) {
      console.error("Theme update failed:", error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateTheme,
    isAuthenticated: !!user,
    loginWithGoogle, // add this to context
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
