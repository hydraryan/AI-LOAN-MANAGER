import express from "express";
import { getDashboardStats } from "../controllers/reportController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/dashboard", authMiddleware, getDashboardStats);

export default router;