// DEPRECATED: This file uses the old auth system
// Use auth.routes.js instead which uses the standardized JWT configuration
// This file is kept for backward compatibility but should be migrated

import { Router } from "express";
import { login, register, refresh, logout } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: "ERROR", message: "email and password are required" });
    }
    const result = await login({ email, password }, res);
    res.json({ status: "OK", ...result });
  } catch (err) {
    next(err);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: "ERROR", message: "email and password are required" });
    }
    const result = await register({ email, password }, res);
    res.status(201).json({ status: "OK", ...result });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const result = await refresh(req, res);
    res.json({ status: "OK", ...result });
  } catch (err) {
    next(err);
  }
});

// Protected route: returns current user
router.get("/me", requireAuth, (req, res) => {
  return res.json({
    status: "OK",
    user: req.user,
  });
});

export default router;
