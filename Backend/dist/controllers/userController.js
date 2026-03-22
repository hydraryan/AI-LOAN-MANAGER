"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = void 0;
const models_1 = require("../models");
const getUsers = async (_req, res) => {
    try {
        const users = await models_1.User.find().select("-passwordHash");
        const formatted = users.map((u) => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: "Active",
            lastActive: "Now"
        }));
        res.json(formatted);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getUsers = getUsers;
//# sourceMappingURL=userController.js.map