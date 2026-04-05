import mongoose, { Schema, Document } from "mongoose";

export interface IInvestor extends Document {
  name: string;
  email: string;
  investorType: "Individual" | "Corporate" | "Bank" | "MutualFund";
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  accountNumber?: string;
  accountHolderName?: string;
  ifscCode?: string;
  kycStatus: "Pending" | "Verified" | "Rejected";
  status: "Active" | "Inactive" | "Suspended";
  userId?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const investorSchema = new Schema<IInvestor>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    investorType: {
      type: String,
      enum: ["Individual", "Corporate", "Bank", "MutualFund"],
      default: "Individual"
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    accountNumber: {
      type: String,
      trim: true
    },
    accountHolderName: {
      type: String,
      trim: true
    },
    ifscCode: {
      type: String,
      trim: true
    },
    kycStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending"
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active"
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model<IInvestor>("Investor", investorSchema);