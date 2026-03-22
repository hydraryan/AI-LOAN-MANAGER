"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const collateralController_1 = require("../controllers/collateralController");
const router = express_1.default.Router();
router.get("/", collateralController_1.getCollateral);
exports.default = router;
//# sourceMappingURL=collateralRoutes.js.map