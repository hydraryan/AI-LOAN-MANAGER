"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.createUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../models");
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "name, email and password are required" });
        }
        const existing = await models_1.User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "Email already exists" });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await models_1.User.create({
            name,
            email,
            passwordHash,
            role: role || "admin"
        });
        res.status(201).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.createUser = createUser;
const getUsers = async (_req, res) => {
    try {
        const users = await models_1.User.find().select("-passwordHash");
        const formatted = users.map((u) => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt
        }));
        res.json(formatted);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getUsers = getUsers;
//# sourceMappingURL=userController.js.map