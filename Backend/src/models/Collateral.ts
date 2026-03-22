import mongoose, { Schema, Document } from "mongoose";

export interface ICollateral extends Document {
  borrowerId: mongoose.Types.ObjectId;
  type: string;
  productName: string;
  value: number;
  serialNumber: string;
  status: string;
  dateDeposited: Date;
}

const collateralSchema = new Schema<ICollateral>({
  borrowerId: { type: Schema.Types.ObjectId, ref: "Borrower" },
  type: String,
  productName: String,
  value: Number,
  serialNumber: String,
  status: { type: String, default: "Deposited" },
  dateDeposited: { type: Date, default: Date.now }
});

export default mongoose.model<ICollateral>("Collateral", collateralSchema);