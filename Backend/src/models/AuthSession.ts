import mongoose, { Document, Schema } from "mongoose";

export interface IAuthSession extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  userAgentHash: string;
  ipHash: string;
  expiresAt: Date;
  rotatedAt?: Date;
  revokedAt?: Date;
  lastSeenAt?: Date;
}

const authSessionSchema = new Schema<IAuthSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userAgentHash: {
      type: String,
      required: true
    },
    ipHash: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    rotatedAt: Date,
    revokedAt: Date,
    lastSeenAt: Date
  },
  { timestamps: true }
);

authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IAuthSession>("AuthSession", authSessionSchema);