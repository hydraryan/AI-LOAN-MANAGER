import express from "express";
import { createUser, getUsers } from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getUsers);
router.post("/", authMiddleware, createUser);

export default router;