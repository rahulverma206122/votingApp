import React, { useState } from "react";
import { register } from "../api";

const FIELDS = [
  { name: "name",             type: "text",     placeholder: "Full Name" },
  { name: "age",              type: "number",   placeholder: "Age" },
  { name: "address",          type: "text",     placeholder: "Address" },
  { name: "aadharCardNumber", type: "text",     placeholder: "Aadhar Card Number (12 digits)", maxLength: 12, inputMode: "numeric", pattern: "\\d{12}" },
  { name: "password",         type: "password", placeholder: "Password" },
];

const INITIAL_FORM = {
  name: "",
  age: "",
  address: "",
  aadharCardNumber: "",
  password: "",
};

export default function Register() {
  const [form, setForm]       = useState(INITIAL_FORM);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function getPasswordStrength(password) {
    if (!password) return null;
    if (password.length < 6) return { label: "Weak", color: "text-red-400", bar: "w-1/3 bg-red-400" };
    if (password.length < 10 || !/[^a-zA-Z0-9]/.test(password)) return { label: "Medium", color: "text-yellow-500", bar: "w-2/3 bg-yellow-400" };
    return { label: "Strong", color: "text-green-600", bar: "w-full bg-green-500" };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const age = Number(form.age);
    if (!age || age < 18 || age > 120) {
      setError("Age must be between 18 and 120.");
      return;
    }

    if (!/^\d{12}$/.test(form.aadharCardNumber)) {
      setError("Aadhar Card Number must be exactly 12 digits.");
      return;
    }

    setLoading(true);
    try {
      const res = await register(form);
      if (res.success) {
        window.location.href = "/";
      } else {
        setError(res.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const aadharLen      = form.aadharCardNumber.length;
  const passwordStrength = getPasswordStrength(form.password);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 shadow-xl rounded-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>

        {error && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        {FIELDS.map(({ name, type, placeholder, maxLength, inputMode, pattern }) => (
          <div key={name} className="mb-3">
            {name === "password" ? (
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400 pr-16"
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
            ) : (
              <input
                name={name}
                type={type}
                placeholder={placeholder}
                className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                value={form[name]}
                onChange={handleChange}
                maxLength={maxLength}
                inputMode={inputMode}
                pattern={pattern}
                required
              />
            )}

            {name === "aadharCardNumber" && aadharLen > 0 && (
              <p className={`text-xs mt-1 ${aadharLen === 12 ? "text-green-600" : "text-red-400"}`}>
                {aadharLen}/12 digits{aadharLen === 12 ? " — looks good!" : " — keep going"}
              </p>
            )}

            {name === "password" && passwordStrength && (
              <div className="mt-1">
                <div className="h-1 w-full bg-gray-200 rounded">
                  <div className={`h-1 rounded transition-all duration-300 ${passwordStrength.bar}`} />
                </div>
                <p className={`text-xs mt-1 ${passwordStrength.color}`}>
                  {passwordStrength.label} password
                </p>
              </div>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white w-full py-2 rounded transition-colors mt-1"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-sm text-center mt-4 text-gray-600">
          Already have an account?{" "}
          <a href="/" className="text-blue-600 hover:underline">Login</a>
        </p>
      </form>
    </div>
  );
}