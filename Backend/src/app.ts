import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import connectDB from "./config/db";
import { env } from "./config/env";

import authRoutes from "./routes/authRoutes";
import loanRoutes from "./routes/loanRoutes";
import userRoutes from "./routes/userRoutes";
import borrowerRoutes from "./routes/borrowerRoutes";
import savingsRoutes from "./routes/savingsRoutes";
import termDepositRoutes from "./routes/termDepositRoutes";
import savingsTransactionRoutes from "./routes/savingsTransactionRoutes";
import cashSafeRoutes from "./routes/cashSafeRoutes";
import reportRoutes from "./routes/reportRoutes";
import repaymentRoutes from "./routes/repaymentRoutes";
import investorRoutes from "./routes/investorRoutes";
import collateralRoutes from "./routes/collateralRoutes";
import groupRoutes from "./routes/groupRoutes";
import accountRoutes from "./routes/accountRoutes";
import calendarRoutes from "./routes/calendarRoutes";
import collectionRoutes from "./routes/collectionRoutes";
import investorAccountRoutes from "./routes/investorAccountRoutes";
import investmentRoutes from "./routes/investmentRoutes";
import settingsRoutes from "./routes/settingsRoutes";


const app = express();

connectDB();
app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.FRONTEND_ORIGINS,
    credentials: true
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.send("API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/users", userRoutes);
app.use("/api/borrowers", borrowerRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/term-deposits", termDepositRoutes);
app.use("/api/savings-transactions", savingsTransactionRoutes);
app.use("/api/cash-safe", cashSafeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/repayments", repaymentRoutes);
app.use("/api/investors", investorRoutes);
app.use("/api/collateral", collateralRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/investor-accounts", investorAccountRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/settings", settingsRoutes);

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});