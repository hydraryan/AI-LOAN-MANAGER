import express from "express";
import {
	addLoanComment,
	createLoan,
	getLoanById,
	getLoanComments,
	getLoanGuarantors,
	getLoans,
	updateLoan,
	updateLoanStatus,
	updateLoanGuarantors
} from "../controllers/loanController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, createLoan);
router.get("/", authMiddleware, getLoans);
router.get("/:id/guarantors", authMiddleware, getLoanGuarantors);
router.put("/:id/guarantors", authMiddleware, updateLoanGuarantors);
router.get("/:id/comments", authMiddleware, getLoanComments);
router.post("/:id/comments", authMiddleware, addLoanComment);
router.put("/:id", authMiddleware, updateLoan);
router.patch("/:id/status", authMiddleware, updateLoanStatus);
router.get("/:id", authMiddleware, getLoanById);

export default router;