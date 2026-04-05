import mongoose, { Document, Schema } from "mongoose";

interface ISchedule {
  dueDate: Date;
  amount: number;
  paidAmount: number;
  status: "pending" | "paid" | "overdue";
}

interface IGuarantor {
  name: string;
  phone?: string;
  relation?: string;
  addedAt: Date;
}

interface ILoanComment {
  text: string;
  createdAt: Date;
}

export type LoanStatus = "pending" | "approved" | "active" | "paid" | "closed" | "defaulted";

export interface ILoan extends Document {
  borrowerId: mongoose.Types.ObjectId;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emi: number;
  status: LoanStatus;
  schedule: ISchedule[];
  guarantors: IGuarantor[];
  comments: ILoanComment[];
  createdAt: Date;
  updatedAt: Date;
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

const guarantorSchema = new Schema<IGuarantor>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    relation: { type: String, trim: true },
    addedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const loanCommentSchema = new Schema<ILoanComment>(
  {
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

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
      enum: ["pending", "approved", "active", "paid", "closed", "defaulted"],
      default: "approved"
    },
    schedule: [scheduleSchema],
    guarantors: { type: [guarantorSchema], default: [] },
    comments: { type: [loanCommentSchema], default: [] }
  },
  { timestamps: true, optimisticConcurrency: true }
);

export default mongoose.model<ILoan>("Loan", loanSchema);