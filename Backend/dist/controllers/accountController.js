"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccount = exports.getAccounts = void 0;
const Account_1 = __importDefault(require("../models/Account"));
const getAccounts = async (_req, res) => {
    const data = await Account_1.default.find();
    res.json(data);
};
exports.getAccounts = getAccounts;
const createAccount = async (req, res) => {
    const account = await Account_1.default.create(req.body);
    res.json(account);
};
exports.createAccount = createAccount;
//# sourceMappingURL=accountController.js.map