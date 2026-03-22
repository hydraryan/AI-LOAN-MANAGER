"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const repaymentController_1 = require("../controllers/repaymentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const repaymentController_2 = require("../controllers/repaymentController");
const router = express_1.default.Router();
router.post("/bulk", authMiddleware_1.authMiddleware, repaymentController_1.bulkRepayment);
router.get("/", authMiddleware_1.authMiddleware, repaymentController_2.getRepayments);
exports.default = router;
//# sourceMappingURL=repaymentRoutes.js.map