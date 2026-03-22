import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import connectDB from "./config/db";

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

import authRoutes from "./routes/authRoutes";
import loanRoutes from "./routes/loanRoutes";
import userRoutes from "./routes/userRoutes";
import borrowerRoutes from "./routes/borrowerRoutes";
import savingsRoutes from "./routes/savingsRoutes";
import reportRoutes from "./routes/reportRoutes";
import repaymentRoutes from "./routes/repaymentRoutes";
import investorRoutes from "./routes/investorRoutes";
import collateralRoutes from "./routes/collateralRoutes";
import groupRoutes from "./routes/groupRoutes";
import accountRoutes from "./routes/accountRoutes";


const app = express();

connectDB();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/users", userRoutes);
app.use("/api/borrowers", borrowerRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/repayments", repaymentRoutes);
app.use("/api/investors", investorRoutes);
app.use("/api/collateral", collateralRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/groups", groupRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});