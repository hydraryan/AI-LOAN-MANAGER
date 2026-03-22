import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  loanId: mongoose.Types.ObjectId;
  amount: number;
  status: string;
}

const transactionSchema = new Schema<ITransaction>(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan"
    },
    amount: Number,
    status: {
      type: String,
      default: "success"
    }
  },
  { timestamps: true }
);

export default mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);