"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroups = exports.createGroup = void 0;
const Group_1 = __importDefault(require("../models/Group")); // ✅ FIX 1: IMPORT MODEL
// ✅ CREATE GROUP
const createGroup = async (req, res) => {
    try {
        const group = await Group_1.default.create(req.body);
        res.status(201).json(group);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.createGroup = createGroup;
// ✅ GET ALL GROUPS
const getGroups = async (_req, res) => {
    try {
        const groups = await Group_1.default.find() // ✅ FIX 2: correct method
            .populate({
            path: "leaderId",
            populate: { path: "userId" }
        })
            .populate({
            path: "members",
            populate: { path: "userId" }
        });
        res.json(groups);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getGroups = getGroups;
//# sourceMappingURL=groupController.js.map