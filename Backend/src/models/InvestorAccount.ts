import mongoose, { Schema, Document } from "mongoose";

export interface IInvestorAccount extends Document {
  investorId: mongoose.Types.ObjectId;
  accountNumber: string;
  accountType: "savings" | "checking" | "investment" | "other";
  bank: string;
  balance: number;
  currency: string;
  status: "active" | "inactive" | "suspended";
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const investorAccountSchema = new Schema<IInvestorAccount>(
  {
    investorId: {
      type: Schema.Types.ObjectId,
      ref: "Investor",
      required: true,
      index: true
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    accountType: {
      type: String,
      enum: ["savings", "checking", "investment", "other"],
      required: true
    },
    bank: {
      type: String,
      required: true,
      trim: true
    },
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

export default mongoose.model<IInvestorAccount>("InvestorAccount", investorAccountSchema);
