import express from "express";
import {
  approveSavingsTransaction,
  bulkCreateSavingsTransactions,
  createSavingsTransaction,
  getSavingsTransactionReport,
  getSavingsTransactions,
  rejectSavingsTransaction
} from "../controllers/savingsTransactionController";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getSavingsTransactions);
router.get("/report", authMiddleware, requireRole(["admin"]), getSavingsTransactionReport);
router.post("/", authMiddleware, createSavingsTransaction);
router.post("/bulk", authMiddleware, bulkCreateSavingsTransactions);
router.post("/:id/approve", authMiddleware, requireRole(["admin"]), approveSavingsTransaction);
router.post("/:id/reject", authMiddleware, requireRole(["admin"]), rejectSavingsTransaction);

export default router;