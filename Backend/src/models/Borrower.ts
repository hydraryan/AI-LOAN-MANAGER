import mongoose, { Document, Schema } from "mongoose";

export interface IBorrower extends Document {
  userId: mongoose.Types.ObjectId;
  phone: string;
  address: string;
}

const borrowerSchema = new Schema<IBorrower>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    phone: String,
    address: String
  },
  { timestamps: true }
);

export default mongoose.model<IBorrower>("Borrower", borrowerSchema);