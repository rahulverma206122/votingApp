import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import AdminDashboard from "./pages/admindashboard";
import Vote from "./pages/vote";
import Results from "./pages/Results";

// ✅ Protected Route
const ProtectedRoute = ({ children }) => {   // without this anyone can access page without login 
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/vote" element={<ProtectedRoute><Vote /></ProtectedRoute>} />
        <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}