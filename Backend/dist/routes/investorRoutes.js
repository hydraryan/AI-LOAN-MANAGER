"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const investorController_1 = require("../controllers/investorController");
const router = express_1.default.Router();
router.get("/", investorController_1.getInvestors);
exports.default = router;
//# sourceMappingURL=investorRoutes.js.map