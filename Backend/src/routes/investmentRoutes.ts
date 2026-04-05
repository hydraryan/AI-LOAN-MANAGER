import express from "express";
import {
  getInvestments,
  getInvestmentById,
  getInvestmentsByInvestorId,
  getInvestmentsByLoanId,
  createInvestment,
  updateInvestment,
  deleteInvestment
} from "../controllers/investmentController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getInvestments);
router.post("/", authMiddleware, createInvestment);
// Investor's investments
router.get("/investor/:investorId", authMiddleware, getInvestmentsByInvestorId);
// Loan's investments
router.get("/loan/:loanId", authMiddleware, getInvestmentsByLoanId);
router.get("/:id", authMiddleware, getInvestmentById);
router.put("/:id", authMiddleware, updateInvestment);
router.delete("/:id", authMiddleware, deleteInvestment);

export default router;
