import React, { useState } from "react";
import { login } from "../api";

const INITIAL_STATE = {
  aadharCardNumber: "",
  password:         "",
};

export default function Login() {
  const [form, setForm]       = useState(INITIAL_STATE);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!/^\d{12}$/.test(form.aadharCardNumber)) {
      setError("Aadhar Card Number must be exactly 12 digits.");
      return;
    }

    setLoading(true);
    try {
      const res = await login(form);

      if (res.success) {
        localStorage.setItem("token", res.token);
        window.location.href = res.user.role === "admin" ? "/admin" : "/vote";
      } else {
        setError(res.error || "Login failed. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const aadharLen = form.aadharCardNumber.length;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 shadow-xl rounded-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {error && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        {/* Aadhaar Field */}
        <div className="mb-3">
          <input
            name="aadharCardNumber"
            type="text"
            placeholder="Aadhar Card Number (12 digits)"
            className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.aadharCardNumber}
            onChange={handleChange}
            maxLength={12}
            inputMode="numeric"
            pattern="\d{12}"
            required
          />
          {aadharLen > 0 && (
            <p className={`text-xs mt-1 ${aadharLen === 12 ? "text-green-600" : "text-red-400"}`}>
              {aadharLen}/12 digits{aadharLen === 12 ? " — looks good!" : " — keep going"}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="mb-4">
          <div className="relative">
            <input
              name="password"
              type={showPass ? "text" : "password"}
              placeholder="Password"
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-400 pr-16"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white w-full py-2 rounded transition-colors"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-center mt-4 text-gray-600">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Register
          </a>
        </p>
      </form>
    </div>
  );
}