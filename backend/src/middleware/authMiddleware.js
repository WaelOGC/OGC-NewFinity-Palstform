// DEPRECATED: This file uses old JWT configuration (JWT_SECRET)
// Use auth.js middleware (requireAuth) instead which uses the standardized JWT configuration
// This file is kept for backward compatibility but should not be used in new code

import jwt from "jsonwebtoken";

// Use standardized JWT config (with fallback to old names for backward compatibility)
const {
  JWT_ACCESS_SECRET,
  JWT_SECRET, // fallback for old code
} = process.env;

const SECRET = JWT_ACCESS_SECRET || JWT_SECRET;

export function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return res
        .status(401)
        .json({ status: "ERROR", message: "Authorization token missing" });
    }

    const payload = jwt.verify(token, SECRET);

    // Attach user payload to the request for downstream handlers
    // Support both 'userId' and 'id' for backward compatibility
    const userId = payload.userId || payload.id;
    req.user = {
      id: userId,
      email: payload.email,
      fullName: payload.fullName,
    };

    return next();
  } catch (error) {
    console.error("authRequired error:", error);
    return res
      .status(401)
      .json({ status: "ERROR", message: "Invalid or expired token" });
  }
}
