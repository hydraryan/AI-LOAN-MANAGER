"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const savingsController_1 = require("../controllers/savingsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/", authMiddleware_1.authMiddleware, savingsController_1.createSavings);
router.get("/", authMiddleware_1.authMiddleware, savingsController_1.getSavings);
exports.default = router;
//# sourceMappingURL=savingsRoutes.js.map