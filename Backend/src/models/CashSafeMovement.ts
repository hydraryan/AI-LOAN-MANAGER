import mongoose, { Document, Schema } from "mongoose";

export interface ICashSafeMovement extends Document {
  cashSafeId: mongoose.Types.ObjectId;
  type: "deposit" | "withdrawal" | "adjustment";
  amount: number;
  reference?: string;
  notes?: string;
  postedAt: Date;
  postedBy?: string;
}

const cashSafeMovementSchema = new Schema<ICashSafeMovement>(
  {
    cashSafeId: {
      type: Schema.Types.ObjectId,
      ref: "CashSafe",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "adjustment"],
      required: true
    },
    amount: { type: Number, required: true },
    reference: String,
    notes: String,
    postedAt: { type: Date, default: Date.now },
    postedBy: String
  },
  { timestamps: true }
);

export default mongoose.model<ICashSafeMovement>("CashSafeMovement", cashSafeMovementSchema);