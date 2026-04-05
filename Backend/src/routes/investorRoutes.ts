import express from "express";
import {
  createInvestor,
  getInvestors,
  getInvestor,
  updateInvestor,
  updateInvestorStatus,
  deleteInvestor
} from "../controllers/investorController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, createInvestor);
router.get("/", authMiddleware, getInvestors);
router.get("/:id", authMiddleware, getInvestor);
router.put("/:id", authMiddleware, updateInvestor);
router.patch("/:id/status", authMiddleware, updateInvestorStatus);
router.delete("/:id", authMiddleware, deleteInvestor);

export default router;