"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSavings = exports.createSavings = void 0;
const Savings_1 = __importDefault(require("../models/Savings"));
const createSavings = async (req, res) => {
    try {
        const { borrowerId, accountNumber, balance, interestRate } = req.body;
        const savings = await Savings_1.default.create({
            borrowerId,
            accountNumber,
            balance,
            interestRate
        });
        res.json(savings);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.createSavings = createSavings;
const getSavings = async (_req, res) => {
    try {
        const data = await Savings_1.default.find().populate({
            path: "borrowerId",
            populate: { path: "userId" }
        });
        const formatted = data.map((s) => ({
            id: s._id,
            accountNumber: s.accountNumber,
            borrowerName: s.borrowerId?.userId?.name,
            productName: s.productName,
            balance: s.balance,
            interestRate: s.interestRate,
            status: s.status
        }));
        res.json(formatted);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getSavings = getSavings;
//# sourceMappingURL=savingsController.js.map