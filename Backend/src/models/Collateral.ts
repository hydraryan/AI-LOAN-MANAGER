import mongoose, { Schema, Document } from "mongoose";

export interface ICollateral extends Document {
  borrowerId: mongoose.Types.ObjectId;
  loanId?: mongoose.Types.ObjectId;
  type: string;
  productName: string;
  value: number;
  serialNumber: string;
  status: string;
  dateDeposited: Date;
}

const collateralSchema = new Schema<ICollateral>({
  borrowerId: { type: Schema.Types.ObjectId, ref: "Borrower" },
  loanId: { type: Schema.Types.ObjectId, ref: "Loan", default: null },
  type: String,
  productName: String,
  value: Number,
  serialNumber: String,
  status: { type: String, default: "Deposited" },
  dateDeposited: { type: Date, default: Date.now }
});

// Supports GET /collateral/loan/:loanId and loan summary aggregation filters.
collateralSchema.index({ loanId: 1 });
// Supports serial number uniqueness checks during create/update validation.
collateralSchema.index({ serialNumber: 1 });
// Supports borrower-centric collateral lookups with optional loan linkage.
collateralSchema.index({ borrowerId: 1, loanId: 1 });

export default mongoose.model<ICollateral>("Collateral", collateralSchema);