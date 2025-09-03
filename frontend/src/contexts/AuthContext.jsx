import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

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

  // Run only when app first loads
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // ✅ LOGIN
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userData); // update state immediately ✅

      return { success: true, user: userData };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      return { success: false, message: errorMessage };
    }
  };

  // ✅ REGISTER (patient/doctor)
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => !!token && !!user;
  const isDoctor = () => user?.role === "doctor";
  const isPatient = () => user?.role === "patient";
  const isAdmin = () => user?.role === "admin";

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    isDoctor,
    isPatient,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
