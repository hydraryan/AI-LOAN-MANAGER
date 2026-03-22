import express from "express";
import { createBorrower, getBorrowers } from "../controllers/borrowerController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, createBorrower);
router.get("/", authMiddleware, getBorrowers);

export default router;