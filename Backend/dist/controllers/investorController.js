"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvestors = exports.createInvestor = void 0;
const Investors_1 = __importDefault(require("../models/Investors"));
const createInvestor = async (req, res) => {
    try {
        const { name, email, totalInvested, activeLoans, status } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: "name and email are required" });
        }
        const investor = await Investors_1.default.create({
            name,
            email,
            totalInvested: Number(totalInvested || 0),
            activeLoans: Number(activeLoans || 0),
            status: status || "Active"
        });
        res.status(201).json(investor);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.createInvestor = createInvestor;
const getInvestors = async (_req, res) => {
    try {
        const data = await Investors_1.default.find();
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getInvestors = getInvestors;
//# sourceMappingURL=investorController.js.map