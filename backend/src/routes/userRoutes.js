import { Router } from "express";
import {
  listUsers,
  getUser,
  createUserHandler,
  deleteUserHandler,
} from "../controllers/userController.js";

const router = Router();

router.get("/", listUsers);
router.get("/:id", getUser);
router.post("/", createUserHandler);
router.delete("/:id", deleteUserHandler);

export default router;
