// src/api/axios.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_BASE,
});

// Automatically add Authorization header if token exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // or 'hms_token' depending on your app
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
