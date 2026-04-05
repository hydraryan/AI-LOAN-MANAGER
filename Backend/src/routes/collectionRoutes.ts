import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createCollectionEntry,
  getCollectionEntries,
  getDailyCollectionSheet,
  getMissedRepaymentSheet,
  getPastMaturitySheet,
  sendCollectionEmail,
  sendCollectionSms,
} from "../controllers/collectionController";

const router = express.Router();

router.get("/daily", authMiddleware, getDailyCollectionSheet);
router.get("/missed", authMiddleware, getMissedRepaymentSheet);
router.get("/past-maturity", authMiddleware, getPastMaturitySheet);
router.get("/entries", authMiddleware, getCollectionEntries);
router.post("/entries", authMiddleware, createCollectionEntry);
router.post("/sms", authMiddleware, sendCollectionSms);
router.post("/email", authMiddleware, sendCollectionEmail);

export default router;
