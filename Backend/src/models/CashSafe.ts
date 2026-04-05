import mongoose, { Document, Schema } from "mongoose";

export interface ICashSafe extends Document {
  name: string;
  openingBalance: number;
  currentBalance: number;
  lastReconciledAt?: Date;
  notes?: string;
}

const cashSafeSchema = new Schema<ICashSafe>(
  {
    name: { type: String, default: "Main Cash Safe" },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    lastReconciledAt: Date,
    notes: String
  },
  { timestamps: true }
);

export default mongoose.model<ICashSafe>("CashSafe", cashSafeSchema);