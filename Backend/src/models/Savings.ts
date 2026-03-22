import mongoose, { Schema, Document } from "mongoose";

export interface ISavings extends Document {
  borrowerId: mongoose.Types.ObjectId;
  accountNumber: string;
  productName: string;
  balance: number;
  interestRate: number;
  status: "Active" | "Dormant" | "Closed";
}

const savingsSchema = new Schema<ISavings>(
  {
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: "Borrower",
      required: true
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true
    },
    productName: {
      type: String,
      default: "Savings Account"
    },
    balance: {
      type: Number,
      default: 0
    },
    interestRate: {
      type: Number,
      default: 5
    },
    status: {
      type: String,
      enum: ["Active", "Dormant", "Closed"],
      default: "Active"
    }
  },
  { timestamps: true }
);

export default mongoose.model<ISavings>("Savings", savingsSchema);