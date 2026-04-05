import mongoose, { Schema, Document } from "mongoose";

export interface IInvestment extends Document {
  investorId: mongoose.Types.ObjectId;
  loanId: mongoose.Types.ObjectId;
  amount: number;
  interestRate: number;
  investmentDate: Date;
  expectedReturnDate: Date;
  status: "pending" | "active" | "completed" | "defaulted";
  totalReturned: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const investmentSchema = new Schema<IInvestment>(
  {
    investorId: {
      type: Schema.Types.ObjectId,
      ref: "Investor",
      required: true,
      index: true
    },
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    interestRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    investmentDate: {
      type: Date,
      default: Date.now
    },
    expectedReturnDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "defaulted"],
      default: "pending",
      index: true
    },
    totalReturned: {
      type: Number,
      default: 0,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Index for date-based queries
investmentSchema.index({ investmentDate: -1 });

export default mongoose.model<IInvestment>("Investment", investmentSchema);
