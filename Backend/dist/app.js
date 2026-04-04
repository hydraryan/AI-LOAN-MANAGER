"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = __importDefault(require("./config/db"));
dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, "../.env")
});
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const loanRoutes_1 = __importDefault(require("./routes/loanRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const borrowerRoutes_1 = __importDefault(require("./routes/borrowerRoutes"));
const savingsRoutes_1 = __importDefault(require("./routes/savingsRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const repaymentRoutes_1 = __importDefault(require("./routes/repaymentRoutes"));
const investorRoutes_1 = __importDefault(require("./routes/investorRoutes"));
const collateralRoutes_1 = __importDefault(require("./routes/collateralRoutes"));
const groupRoutes_1 = __importDefault(require("./routes/groupRoutes"));
const accountRoutes_1 = __importDefault(require("./routes/accountRoutes"));
const app = (0, express_1.default)();
(0, db_1.default)();
app.set("trust proxy", 1);
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true
}));
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "1mb" }));
app.get("/", (_req, res) => {
    res.send("API Running");
});
app.use("/api/auth", authRoutes_1.default);
app.use("/api/loans", loanRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/borrowers", borrowerRoutes_1.default);
app.use("/api/savings", savingsRoutes_1.default);
app.use("/api/reports", reportRoutes_1.default);
app.use("/api/repayments", repaymentRoutes_1.default);
app.use("/api/investors", investorRoutes_1.default);
app.use("/api/collateral", collateralRoutes_1.default);
app.use("/api/accounts", accountRoutes_1.default);
app.use("/api/groups", groupRoutes_1.default);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on ${PORT}`);
});
//# sourceMappingURL=app.js.map