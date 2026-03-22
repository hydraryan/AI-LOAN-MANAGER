"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signin = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const signup = async (req, res) => {
    const { name, email, password } = req.body;
    const hash = await bcryptjs_1.default.hash(password, 10);
    await models_1.User.create({
        name,
        email,
        passwordHash: hash
    });
    res.json({ message: "User created" });
};
exports.signup = signup;
const signin = async (req, res) => {
    const { email, password } = req.body;
    const user = await models_1.User.findOne({ email });
    if (!user)
        return res.status(404).json({ message: "User not found" });
    const match = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!match)
        return res.status(400).json({ message: "Invalid credentials" });
    const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token });
};
exports.signin = signin;
//# sourceMappingURL=authController.js.map