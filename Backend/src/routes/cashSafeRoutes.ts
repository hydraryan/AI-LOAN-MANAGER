import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  getCashSafe,
  getCashSafeSummary,
  recordCashSafeMovement,
  reconcileCashSafe
} from "../controllers/cashSafeController";

const router = express.Router();

router.get("/", authMiddleware, getCashSafe);
router.get("/summary", authMiddleware, getCashSafeSummary);
router.post("/movements", authMiddleware, recordCashSafeMovement);
router.patch("/reconcile", authMiddleware, reconcileCashSafe);

export default router;