import express from "express";
import { createGroup, getGroups } from "../controllers/groupController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, createGroup);
router.get("/", authMiddleware, getGroups);

export default router;