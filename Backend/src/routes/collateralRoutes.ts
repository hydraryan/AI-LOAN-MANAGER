import express from "express";
import { createCollateral, getCollateral } from "../controllers/collateralController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getCollateral);
router.post("/", authMiddleware, createCollateral);

export default router;