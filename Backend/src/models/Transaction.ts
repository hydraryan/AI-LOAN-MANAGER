import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  loanId?: mongoose.Types.ObjectId;
  savingsAccountId?: mongoose.Types.ObjectId;
  amount: number;
  status: "pending" | "approved" | "rejected";
  requestedAmount?: number;
  unappliedAmount?: number;
  method?:
    | "Cash"
    | "Bank Transfer"
    | "System"
    | "Mobile Money"
    | "Cheque"
    | "UPI"
    | "Card"
    | "cash"
    | "bank transfer"
    | "system"
    | "mobile money"
    | "cheque"
    | "upi"
    | "card";
  postedDate?: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      index: true,
      sparse: true
    },
    savingsAccountId: {
      type: Schema.Types.ObjectId,
      ref: "Savings",
      required: false,
      index: true,
      sparse: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    requestedAmount: {
      type: Number,
      default: 0
    },
    unappliedAmount: {
      type: Number,
      default: 0
    },
    method: {
      type: String,
      enum: [
        "Cash",
        "Bank Transfer",
        "System",
        "Mobile Money",
        "Cheque",
        "UPI",
        "Card",
        "cash",
        "bank transfer",
        "system",
        "mobile money",
        "cheque",
        "upi",
        "card"
      ],
      default: "System"
    },
    postedDate: {
      type: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);