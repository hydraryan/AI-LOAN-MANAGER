import mongoose, { Document, Schema } from "mongoose";

export type CollectionChannel = "call" | "visit" | "sms" | "email";
export type CollectionOutcome =
  | "promised"
  | "paid-partial"
  | "paid-full"
  | "no-response"
  | "refused"
  | "wrong-number";

export interface ICollectionEntry extends Document {
  loanId: mongoose.Types.ObjectId;
  borrowerId: mongoose.Types.ObjectId;
  collectorId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  channel: CollectionChannel;
  outcome: CollectionOutcome;
  amountCollected: number;
  notes?: string;
  followUpAt?: Date;
  contactedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const collectionEntrySchema = new Schema<ICollectionEntry>(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
      index: true,
    },
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: "Borrower",
      required: true,
      index: true,
    },
    collectorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["call", "visit", "sms", "email"],
      required: true,
      default: "call",
    },
    outcome: {
      type: String,
      enum: [
        "promised",
        "paid-partial",
        "paid-full",
        "no-response",
        "refused",
        "wrong-number",
      ],
      required: true,
      default: "promised",
    },
    amountCollected: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    followUpAt: {
      type: Date,
    },
    contactedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICollectionEntry>(
  "CollectionEntry",
  collectionEntrySchema
);
