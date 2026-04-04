import express from "express";
import { createInvestor, getInvestors } from "../controllers/investorController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getInvestors);
router.post("/", authMiddleware, createInvestor);

export default router;