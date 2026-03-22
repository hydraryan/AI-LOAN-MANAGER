"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvestors = void 0;
const Investors_1 = __importDefault(require("../models/Investors"));
const getInvestors = async (_req, res) => {
    const data = await Investors_1.default.find();
    res.json(data);
};
exports.getInvestors = getInvestors;
//# sourceMappingURL=investorController.js.map