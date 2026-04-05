import express from "express";
import { bulkRepayment } from "../controllers/repaymentController";
import { authMiddleware } from "../middleware/authMiddleware";
import { getRepaymentCredits, getRepayments } from "../controllers/repaymentController";
const router = express.Router();
router.post("/bulk", authMiddleware, bulkRepayment);
router.get("/", authMiddleware, getRepayments);
router.get("/credits/:borrowerId", authMiddleware, getRepaymentCredits);
export default router;