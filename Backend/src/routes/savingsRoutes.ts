import express from "express";
import { createSavings, getSavings, updateSavings, deleteSavings } from "../controllers/savingsController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, createSavings);
router.get("/", authMiddleware, getSavings);
router.patch("/:id", authMiddleware, updateSavings);
router.delete("/:id", authMiddleware, deleteSavings);

export default router;