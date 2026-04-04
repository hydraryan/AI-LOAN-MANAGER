import express from "express";
import { getDashboardStats, getHomeDashboardMetrics } from "../controllers/reportController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/dashboard", authMiddleware, getDashboardStats);
router.get("/home", authMiddleware, getHomeDashboardMetrics);

export default router;