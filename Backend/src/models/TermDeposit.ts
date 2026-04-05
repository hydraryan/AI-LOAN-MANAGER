import mongoose, { Schema, Document } from "mongoose";

export interface ITermDeposit extends Document {
  borrowerId: mongoose.Types.ObjectId;
  accountNumber: string;
  principalAmount: number;
  depositDate: Date;
  maturityDate: Date;
  interestRate: number;
  compoundingFrequency: "Monthly" | "Quarterly" | "Annually";
  currentValue: number;
  status: "Active" | "Matured" | "Withdrawn";
  autoRenewal: boolean;
  withdrawalDate?: Date;
  withdrawalAmount?: number;
}

const termDepositSchema = new Schema<ITermDeposit>(
  {
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: "Borrower",
      required: true,
      index: true
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true
    },
    principalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    depositDate: {
      type: Date,
      default: Date.now
    },
    maturityDate: {
      type: Date,
      required: true
    },
    interestRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    compoundingFrequency: {
      type: String,
      enum: ["Monthly", "Quarterly", "Annually"],
      default: "Quarterly"
    },
    currentValue: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["Active", "Matured", "Withdrawn"],
      default: "Active",
      index: true
    },
    autoRenewal: {
      type: Boolean,
      default: false
    },
    withdrawalDate: Date,
    withdrawalAmount: Number
  },
  { timestamps: true }
);

export default mongoose.model<ITermDeposit>("TermDeposit", termDepositSchema);
