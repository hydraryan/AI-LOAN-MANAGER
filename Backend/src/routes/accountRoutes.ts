import express from "express";
import { getAccounts, createAccount } from "../controllers/accountController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getAccounts);
router.post("/", authMiddleware, createAccount);

export default router;