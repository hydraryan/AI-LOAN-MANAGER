import mongoose, { Document, Schema } from "mongoose";

export interface IBorrower extends Document {
  userId?: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  phone: string;
  address: string;
}

const borrowerSchema = new Schema<IBorrower>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    name: String,
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true
    },
    phone: String,
    address: String
  },
  { timestamps: true }
);

export default mongoose.model<IBorrower>("Borrower", borrowerSchema);