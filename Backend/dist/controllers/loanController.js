"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoans = exports.createLoan = void 0;
const models_1 = require("../models");
const loanCalculator_1 = require("../utils/loanCalculator");
const createLoan = async (req, res) => {
    const { borrowerId, principal, interestRate, tenureMonths } = req.body;
    const { emi, schedule } = (0, loanCalculator_1.generateSchedule)(principal, interestRate, tenureMonths);
    const loan = await models_1.Loan.create({
        borrowerId,
        principal,
        interestRate,
        tenureMonths,
        emi,
        schedule
    });
    res.json(loan);
};
exports.createLoan = createLoan;
const getLoans = async (_req, res) => {
    const loans = await models_1.Loan.find().populate({
        path: "borrowerId",
        populate: { path: "userId" }
    });
    const formatted = loans.map((loan) => ({
        id: loan._id,
        borrower: loan.borrowerId?.userId?.name,
        principal: loan.principal,
        emi: loan.emi,
        status: loan.status,
        schedule: loan.schedule
    }));
    res.json(formatted);
};
exports.getLoans = getLoans;
//# sourceMappingURL=loanController.js.map