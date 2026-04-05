import express from "express";
import {
	createBorrower,
	getBorrowers,
	getBorrowerById,
	updateBorrower,
	deleteBorrower
} from "../controllers/borrowerController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, createBorrower);
router.get("/", authMiddleware, getBorrowers);
router.get("/:id", authMiddleware, getBorrowerById);
router.put("/:id", authMiddleware, updateBorrower);
router.delete("/:id", authMiddleware, deleteBorrower);

export default router;