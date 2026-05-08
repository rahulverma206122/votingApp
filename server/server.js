require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./db");  // ✅ renamed

const app = express();

app.use(express.json());

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
}));

connectDB(); // ✅ actually call it

app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

const userRoutes      = require("./routes/userRoutes");
const candidateRoutes = require("./routes/candidateRoutes");

app.use("/api/user",      userRoutes);
app.use("/api/candidate", candidateRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});