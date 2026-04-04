"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoans = exports.createLoan = void 0;
const models_1 = require("../models");
const loanCalculator_1 = require("../utils/loanCalculator");
const createLoan = async (req, res) => {
    try {
        const { borrowerId, principal, interestRate, tenureMonths } = req.body;
        if (!borrowerId) {
            return res.status(400).json({ error: "borrowerId is required" });
        }
        const parsedPrincipal = Number(principal);
        const parsedInterestRate = Number(interestRate);
        const parsedTenureMonths = Number(tenureMonths);
        if (Number.isNaN(parsedPrincipal) ||
            Number.isNaN(parsedInterestRate) ||
            Number.isNaN(parsedTenureMonths) ||
            parsedPrincipal <= 0 ||
            parsedInterestRate < 0 ||
            parsedTenureMonths <= 0) {
            return res.status(400).json({ error: "Invalid loan input values" });
        }
        const { emi, schedule } = (0, loanCalculator_1.generateSchedule)(parsedPrincipal, parsedInterestRate, parsedTenureMonths);
        const loan = await models_1.Loan.create({
            borrowerId,
            principal: parsedPrincipal,
            interestRate: parsedInterestRate,
            tenureMonths: parsedTenureMonths,
            emi,
            schedule
        });
        res.status(201).json(loan);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.createLoan = createLoan;
const getLoans = async (_req, res) => {
    const loans = await models_1.Loan.find().populate({
        path: "borrowerId",
        populate: { path: "userId" }
    });
    res.json(loans);
};
exports.getLoans = getLoans;
//# sourceMappingURL=loanController.js.map