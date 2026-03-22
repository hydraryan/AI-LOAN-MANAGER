"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const accountController_1 = require("../controllers/accountController");
const router = express_1.default.Router();
router.get("/", accountController_1.getAccounts);
router.post("/", accountController_1.createAccount);
exports.default = router;
//# sourceMappingURL=accountRoutes.js.map