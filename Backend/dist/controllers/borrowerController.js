"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBorrowers = exports.createBorrower = void 0;
const models_1 = require("../models");
// ✅ CREATE BORROWER
const createBorrower = async (req, res) => {
    try {
        const { userId, name, email, phone, address } = req.body;
        if (!userId && (!name || !email)) {
            return res.status(400).json({ error: "Either userId or both name and email are required" });
        }
        const duplicateFilter = userId
            ? { userId }
            : { email: String(email).toLowerCase().trim() };
        const existingBorrower = await models_1.Borrower.findOne(duplicateFilter);
        if (existingBorrower) {
            return res.status(400).json({ error: "Borrower profile already exists" });
        }
        const borrower = await models_1.Borrower.create({
            userId,
            name,
            email,
            phone,
            address
        });
        res.status(201).json(borrower);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.createBorrower = createBorrower;
// ✅ GET BORROWERS (FINAL VERSION)
const getBorrowers = async (_req, res) => {
    try {
        const borrowers = await models_1.Borrower.find().populate("userId");
        res.json(borrowers); // ✅ keep raw structure
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getBorrowers = getBorrowers;
//# sourceMappingURL=borrowerController.js.map