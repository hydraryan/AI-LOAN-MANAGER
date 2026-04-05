import mongoose, { Document, Schema } from "mongoose";

export interface IRepaymentBulkRequest extends Document {
  idempotencyKey: string;
  responsePayload: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const repaymentBulkRequestSchema = new Schema<IRepaymentBulkRequest>(
  {
    idempotencyKey: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true
    },
    responsePayload: {
      type: Schema.Types.Mixed,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model<IRepaymentBulkRequest>(
  "RepaymentBulkRequest",
  repaymentBulkRequestSchema
);
