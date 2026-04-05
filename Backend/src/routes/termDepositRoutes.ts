import express from "express";
import {
  createTermDeposit,
  getTermDeposits,
  updateTermDeposit,
  deleteTermDeposit,
  renewTermDeposit,
  withdrawTermDeposit
} from "../controllers/termDepositController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, createTermDeposit);
router.get("/", authMiddleware, getTermDeposits);
router.patch("/:id", authMiddleware, updateTermDeposit);
router.delete("/:id", authMiddleware, deleteTermDeposit);
router.post("/:id/renew", authMiddleware, renewTermDeposit);
router.post("/:id/withdraw", authMiddleware, withdrawTermDeposit);

export default router;
