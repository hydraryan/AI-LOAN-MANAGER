import mongoose, { Schema, Document } from "mongoose";

export interface IInvestor extends Document {
  name: string;
  email: string;
  totalInvested: number;
  activeLoans: number;
  status: string;
}

const investorSchema = new Schema<IInvestor>({
  name: String,
  email: String,
  totalInvested: { type: Number, default: 0 },
  activeLoans: { type: Number, default: 0 },
  status: { type: String, default: "Active" }
});

export default mongoose.model<IInvestor>("Investor", investorSchema);