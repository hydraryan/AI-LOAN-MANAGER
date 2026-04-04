import express from "express";
import rateLimit from "express-rate-limit";
import {
  signin,
  refreshSession,
  logout,
  logoutAllSessions,
  getSession
} from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

const signinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again later." }
});

const refreshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many refresh requests. Try again later." }
});

router.post("/signin", signinLimiter, signin);
router.post("/refresh", refreshLimiter, refreshSession);
router.post("/logout", logout);
router.post("/logout-all", authMiddleware, logoutAllSessions);
router.get("/session", authMiddleware, getSession);

export default router;