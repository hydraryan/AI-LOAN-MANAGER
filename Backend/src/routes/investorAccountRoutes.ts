import express from "express";
import {
  getInvestorAccounts,
  getInvestorAccountById,
  getInvestorAccountsByInvestorId,
  createInvestorAccount,
  updateInvestorAccount,
  deleteInvestorAccount
} from "../controllers/investorAccountController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getInvestorAccounts);
router.post("/", authMiddleware, createInvestorAccount);
// Investor's accounts
router.get("/investor/:investorId", authMiddleware, getInvestorAccountsByInvestorId);
router.get("/:id", authMiddleware, getInvestorAccountById);
router.put("/:id", authMiddleware, updateInvestorAccount);
router.delete("/:id", authMiddleware, deleteInvestorAccount);

export default router;
