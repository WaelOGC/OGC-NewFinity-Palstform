import { verifyUserCredentials, createUser } from "../services/userService.js";
import jwt from "jsonwebtoken";

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
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
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
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
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
