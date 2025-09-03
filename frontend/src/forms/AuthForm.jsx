import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function AuthForm({ role }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => setError(null), [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, _id, name, email: userEmail } = res.data;

      localStorage.setItem("hms_token", token);
      localStorage.setItem("hms_user", JSON.stringify({ _id, name, email: userEmail }));

      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h3 className="text-2xl font-semibold mb-2 text-center">{role === "doctor" ? "Doctor" : "Patient"} Login</h3>
        <p className="text-sm text-gray-500 mb-4 text-center">Sign in with your account details</p>

        {error && <div className="bg-red-50 text-red-700 border p-3 rounded mb-3">{String(error)}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-sky-200 p-2"
              placeholder="you@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-sky-200 p-2"
              placeholder="Enter your password" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2 rounded-md bg-sky-600 text-white font-medium hover:opacity-95 disabled:opacity-60">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          Don’t have an account? <Link to="/" className="text-sky-600 hover:underline">Contact admin</Link>
        </div>
      </div>
    </div>
  );
}
