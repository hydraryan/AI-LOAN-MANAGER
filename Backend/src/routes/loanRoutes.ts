import express from "express";
import { createLoan, getLoans } from "../controllers/loanController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, createLoan);
router.get("/", authMiddleware, getLoans);

export default router;