import express from "express";
import { createSavings, getSavings } from "../controllers/savingsController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, createSavings);
router.get("/", authMiddleware, getSavings);

export default router;