// DEPRECATED: This file uses old JWT configuration (JWT_SECRET, JWT_EXPIRES_IN)
// Use auth.controller.js instead which uses the standardized JWT configuration
// This file is kept for backward compatibility but should not be used in new code

import { verifyUserCredentials, createUser } from "../services/userService.js";
import jwt from "jsonwebtoken";

// Use standardized JWT config (with fallback to old names for backward compatibility)
const {
  JWT_ACCESS_SECRET,
  JWT_SECRET, // fallback for old code
  JWT_ACCESS_EXPIRES_IN = '15m',
  JWT_EXPIRES_IN, // fallback for old code
} = process.env;

const SECRET = JWT_ACCESS_SECRET || JWT_SECRET;
const EXPIRES_IN = JWT_ACCESS_EXPIRES_IN || JWT_EXPIRES_IN || "1h";

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "email and password are required" });
    }

    const user = await verifyUserCredentials(email, password);

    if (!user) {
      return res
        .status(401)
        .json({ status: "ERROR", message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      SECRET,
      {
        expiresIn: EXPIRES_IN,
      }
    );

    return res.json({
      status: "OK",
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Login failed",
      error: error.message,
    });
  }
}

export async function register(req, res) {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "email and password are required" });
    }

    // Create user (this already hashes the password)
    const newUser = await createUser({ email, password, fullName });

    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
      },
      SECRET,
      {
        expiresIn: EXPIRES_IN,
      }
    );

    return res.status(201).json({
      status: "OK",
      message: "Registration successful",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("register error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ status: "ERROR", message: "Email already exists" });
    }

    return res.status(500).json({
      status: "ERROR",
      message: "Registration failed",
      error: error.message,
    });
  }
}
