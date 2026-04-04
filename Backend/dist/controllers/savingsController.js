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
        if (!borrowerId || !accountNumber) {
            return res.status(400).json({ error: "borrowerId and accountNumber are required" });
        }
        const parsedBalance = Number(balance ?? 0);
        const parsedInterestRate = Number(interestRate ?? 5);
        if (Number.isNaN(parsedBalance) ||
            Number.isNaN(parsedInterestRate) ||
            parsedBalance < 0 ||
            parsedInterestRate < 0) {
            return res.status(400).json({ error: "Invalid savings input values" });
        }
        const savings = await Savings_1.default.create({
            borrowerId,
            accountNumber,
            balance: parsedBalance,
            interestRate: parsedInterestRate
        });
        res.status(201).json(savings);
    }
    catch (err) {
        if (err?.code === 11000) {
            return res.status(400).json({ error: "Account number already exists" });
        }
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