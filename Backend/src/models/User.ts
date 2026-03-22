import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "officer" | "borrower";
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ["admin", "officer", "borrower"],
      default: "borrower"
    }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);