import { Router } from "express";
import { getDatabaseStatus } from "../controllers/systemController.js";

const router = Router();

router.get("/db-check", getDatabaseStatus);

export default router;
