import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  name: string;
  description: string;
  leaderId: mongoose.Types.ObjectId;
  collectorId: string;
  members: mongoose.Types.ObjectId[];
}

const groupSchema = new Schema<IGroup>(
  {
    name: String,
    description: String,
    leaderId: { type: Schema.Types.ObjectId, ref: "Borrower" },
    collectorId: String,
    members: [{ type: Schema.Types.ObjectId, ref: "Borrower" }]
  },
  { timestamps: true }
);

export default mongoose.model<IGroup>("Group", groupSchema);