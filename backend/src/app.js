import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import systemRoutes from "./routes/systemRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// Middleware
app.use(cors({ credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/system", systemRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "OGC Backend is running" });
});

export default app;
