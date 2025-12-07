import jwt from "jsonwebtoken";

export function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return res
        .status(401)
        .json({ status: "ERROR", message: "Authorization token missing" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user payload to the request for downstream handlers
    req.user = {
      id: payload.id,
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
