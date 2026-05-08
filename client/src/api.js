// client/src/api.js
// ============================================================
// 🌐 API - Central communication layer between frontend & backend
// All server requests go through this file
// ============================================================

const API_BASE = process.env.REACT_APP_BASE_URL || "http://localhost:5000";

// ============================================================
// 🔧 Core Request Function
// Handles: token attachment, headers, error handling for ALL requests
// ============================================================
async function request(path, options = {}) {
  // Get token from browser storage (set during login)
  const token = localStorage.getItem("token");

  // Set default headers
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Attach token to every request if user is logged in
  if (token) headers.Authorization = `Bearer ${token}`;

  // Make the actual API call
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    credentials: "same-origin",
    ...options,
  });

  // Parse response safely (handle empty responses)
  const text = await res.text().catch(() => "");
  const data = text ? JSON.parse(text) : {};

  // Throw error if request failed
  if (!res.ok) {
    throw new Error(data.error || data.message || res.statusText || "Network error");
  }

  return data;
}

// ============================================================
// 👤 USER APIs
// ============================================================

// Register new user → POST /api/user/signup
export const register = (userData) =>
  request("/api/user/signup", {
    method: "POST",
    body: JSON.stringify(userData),
  });

// Login user → POST /api/user/login
export const login = (credentials) =>
  request("/api/user/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

// Get logged in user profile → GET /api/user/profile
export const getProfile = () => request("/api/user/profile");

// ============================================================
// 🗳️ CANDIDATE APIs
// ============================================================

// Get all candidates → GET /api/candidate
export const fetchCandidates = () => request("/api/candidate");

// Add new candidate (admin only) → POST /api/candidate
export const addCandidate = (candidate) =>
  request("/api/candidate", {
    method: "POST",
    body: JSON.stringify(candidate),
  });

// ============================================================
// 📊 VOTING APIs
// ============================================================

// Submit vote for a candidate → POST /api/candidate/vote/:id
export const submitVote = (candidateId) =>
  request(`/api/candidate/vote/${candidateId}`, { method: "POST" });

// Get voting results → GET /api/candidate/results
export const fetchResults = () => request("/api/candidate/results");