"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollateral = void 0;
const Collateral_1 = __importDefault(require("../models/Collateral"));
const getCollateral = async (_req, res) => {
    const data = await Collateral_1.default.find().populate({
        path: "borrowerId",
        populate: { path: "userId" }
    });
    res.json(data);
};
exports.getCollateral = getCollateral;
//# sourceMappingURL=collateralController.js.map