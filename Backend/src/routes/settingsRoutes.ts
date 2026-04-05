import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getMyPreferences, updateMyPreferences } from "../controllers/settingsController";

const router = express.Router();

router.get("/preferences", authMiddleware, getMyPreferences);
router.put("/preferences", authMiddleware, updateMyPreferences);

export default router;
