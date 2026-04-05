import express from "express";
import { createUser, getUserById, getUsers, updateUser, deleteUser } from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getUsers);
router.get("/:id", authMiddleware, getUserById);
router.post("/", authMiddleware, createUser);
router.put("/:id", authMiddleware, updateUser);
router.delete("/:id", authMiddleware, deleteUser);

export default router;