"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollateral = exports.createCollateral = void 0;
const Collateral_1 = __importDefault(require("../models/Collateral"));
const createCollateral = async (req, res) => {
    try {
        const { borrowerId, type, productName, value, serialNumber, status } = req.body;
        if (!borrowerId || !type || !productName || value === undefined || !serialNumber) {
            return res.status(400).json({ error: "borrowerId, type, productName, value and serialNumber are required" });
        }
        const collateral = await Collateral_1.default.create({
            borrowerId,
            type,
            productName,
            value: Number(value),
            serialNumber,
            status: status || "Deposited"
        });
        res.status(201).json(collateral);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.createCollateral = createCollateral;
const getCollateral = async (_req, res) => {
    try {
        const data = await Collateral_1.default.find().populate({
            path: "borrowerId",
            populate: { path: "userId" }
        });
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getCollateral = getCollateral;
//# sourceMappingURL=collateralController.js.map