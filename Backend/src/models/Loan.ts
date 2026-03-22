import mongoose, { Document, Schema } from "mongoose";

interface ISchedule {
  dueDate: Date;
  amount: number;
  paidAmount: number;
  status: "pending" | "paid" | "overdue";
}

export interface ILoan extends Document {
  borrowerId: mongoose.Types.ObjectId;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emi: number;
  status: string;
  schedule: ISchedule[];
}

const scheduleSchema = new Schema<ISchedule>({
  dueDate: Date,
  amount: Number,
  paidAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "paid", "overdue"],
    default: "pending"
  }
});

const loanSchema = new Schema<ILoan>(
  {
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: "Borrower"
    },
    principal: Number,
    interestRate: Number,
    tenureMonths: Number,
    emi: Number,
    status: {
      type: String,
      default: "approved"
    },
    schedule: [scheduleSchema]
  },
  { timestamps: true }
);

export default mongoose.model<ILoan>("Loan", loanSchema);