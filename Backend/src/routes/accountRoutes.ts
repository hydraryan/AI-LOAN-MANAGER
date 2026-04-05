import express from "express";
import {
	getAccounts,
	createAccount,
	getAccountById,
	updateAccount,
	deleteAccount
} from "../controllers/accountController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getAccounts);
router.post("/", authMiddleware, createAccount);
router.get("/:id", authMiddleware, getAccountById);
router.put("/:id", authMiddleware, updateAccount);
router.delete("/:id", authMiddleware, deleteAccount);

export default router;