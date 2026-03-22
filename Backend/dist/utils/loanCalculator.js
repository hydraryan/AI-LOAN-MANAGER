"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSchedule = exports.calculateEMI = void 0;
const calculateEMI = (principal, rate, tenure) => {
    const r = rate / 12 / 100;
    const emi = (principal * r * Math.pow(1 + r, tenure)) /
        (Math.pow(1 + r, tenure) - 1);
    return Math.round(emi);
};
exports.calculateEMI = calculateEMI;
const generateSchedule = (principal, rate, tenure) => {
    const emi = (0, exports.calculateEMI)(principal, rate, tenure);
    const schedule = [];
    let date = new Date();
    for (let i = 0; i < tenure; i++) {
        date.setMonth(date.getMonth() + 1);
        schedule.push({
            dueDate: new Date(date),
            amount: emi,
            paidAmount: 0,
            status: "pending"
        });
    }
    return { emi, schedule };
};
exports.generateSchedule = generateSchedule;
//# sourceMappingURL=loanCalculator.js.map