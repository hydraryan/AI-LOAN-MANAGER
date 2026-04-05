import express from "express";
import {
	createGroup,
	getGroups,
	getGroupById,
	updateGroup,
	deleteGroup
} from "../controllers/groupController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, createGroup);
router.get("/", authMiddleware, getGroups);
router.get("/:id", authMiddleware, getGroupById);
router.put("/:id", authMiddleware, updateGroup);
router.delete("/:id", authMiddleware, deleteGroup);

export default router;