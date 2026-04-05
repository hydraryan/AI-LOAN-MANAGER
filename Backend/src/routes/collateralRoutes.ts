import express from "express";
import {
	getCollateralByLoanId,
	createCollateral,
	getCollateral,
	getCollateralById,
	getCollateralLoanSummary,
	updateCollateral
} from "../controllers/collateralController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getCollateral);
router.get("/loan-summary", authMiddleware, getCollateralLoanSummary);
router.get("/loan/:loanId", authMiddleware, getCollateralByLoanId);
router.get("/:id", authMiddleware, getCollateralById);
router.post("/", authMiddleware, createCollateral);
router.put("/:id", authMiddleware, updateCollateral);

export default router;