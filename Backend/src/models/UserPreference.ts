import mongoose, { Document, Schema } from "mongoose";

export interface IUserPreference extends Document {
  userId: mongoose.Types.ObjectId;
  currency: string;
  dateFormat: string;
  timezone: string;
  theme: "light" | "dark" | "system";
}

const userPreferenceSchema = new Schema<IUserPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    currency: {
      type: String,
      default: "INR",
      trim: true
    },
    dateFormat: {
      type: String,
      default: "DD/MM/YYYY",
      trim: true
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
      trim: true
    },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system"
    }
  },
  { timestamps: true }
);

export default mongoose.model<IUserPreference>("UserPreference", userPreferenceSchema);
