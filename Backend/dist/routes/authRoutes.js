"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
const signinLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many login attempts. Try again later." }
});
const refreshLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many refresh requests. Try again later." }
});
router.post("/signin", signinLimiter, authController_1.signin);
router.post("/refresh", refreshLimiter, authController_1.refreshSession);
router.post("/logout", authController_1.logout);
router.post("/logout-all", authMiddleware_1.authMiddleware, authController_1.logoutAllSessions);
router.get("/session", authMiddleware_1.authMiddleware, authController_1.getSession);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map