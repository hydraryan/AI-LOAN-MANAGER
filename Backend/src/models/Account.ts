import mongoose, { Schema, Document } from "mongoose";

export interface IAccount extends Document {
  code: string;
  name: string;
  type: string;
  balance: number;
}

const accountSchema = new Schema<IAccount>({
  code: String,
  name: String,
  type: String,
  balance: { type: Number, default: 0 }
});

export default mongoose.model<IAccount>("Account", accountSchema);