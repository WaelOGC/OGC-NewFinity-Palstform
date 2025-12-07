import { Router } from "express";
import { login, register } from "../controllers/authController.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);

// Protected route: returns current user
router.get("/me", authRequired, (req, res) => {
  return res.json({
    status: "OK",
    user: req.user,
  });
});

export default router;
