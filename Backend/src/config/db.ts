import mongoose from "mongoose";
import { env } from "./env";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("DB Error:", error);
    process.exit(1);
  }
};

export default connectDB;