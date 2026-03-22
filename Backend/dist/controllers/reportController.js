"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const models_1 = require("../models");
const getDashboardStats = async (_req, res) => {
    try {
        const loans = await models_1.Loan.find();
        const borrowers = await models_1.Borrower.find();
        const savings = await models_1.Savings.find();
        // 💰 Total Disbursement
        const totalDisbursement = loans.reduce((sum, l) => sum + l.principal, 0);
        // 👥 Active Borrowers
        const activeBorrowers = borrowers.length;
        // 💳 Total Savings
        const totalSavings = savings.reduce((sum, s) => sum + s.balance, 0);
        // 📊 Loan Status Distribution
        const statusMap = {};
        loans.forEach((l) => {
            statusMap[l.status] = (statusMap[l.status] || 0) + 1;
        });
        const loanStatus = Object.keys(statusMap).map((k) => ({
            name: k,
            value: statusMap[k]
        }));
        res.json({
            totalDisbursement,
            activeBorrowers,
            totalSavings,
            loanStatus
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=reportController.js.map