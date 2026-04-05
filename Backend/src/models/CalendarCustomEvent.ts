import mongoose, { Document, Schema } from "mongoose";

export type CalendarCustomEventSeverity = "low" | "medium" | "high" | "critical";
export type CalendarCustomEventType =
  | "upcomingEmi"
  | "overdueEmi"
  | "loanMaturity"
  | "statusApprovalDeadline"
  | "repaymentDue"
  | "bulkRepaymentSession"
  | "csvUploadBatch"
  | "collateralDeposit"
  | "collateralReturnSale"
  | "borrowerActionItem"
  | "portfolioAtRisk"
  | "collateralLinkExpiry";

export interface ICalendarCustomEvent extends Document {
  createdBy: mongoose.Types.ObjectId;
  type: CalendarCustomEventType;
  title: string;
  description: string;
  dateStart: Date;
  dateEnd: Date;
  severity: CalendarCustomEventSeverity;
  sourceEntityType: "loan" | "collateral" | "borrower" | "repayment" | "portfolio";
  sourceEntityId: string;
  sourceEntityData?: {
    loanId?: string;
    borrowerId?: string;
    collateralId?: string;
    borrowerName?: string;
    loanAmount?: number;
    overdueAmount?: number;
    daysOverdue?: number;
  };
  deepLinkPath: string;
  deepLinkParams?: Record<string, string>;
  displayColor: "blue" | "green" | "yellow" | "red" | "orange" | "purple";
  displayIcon:
    | "calendar"
    | "alertCircle"
    | "checkCircle"
    | "clock"
    | "creditCard"
    | "package"
    | "fileText"
    | "plus"
    | "trending"
    | "link";
  customMeta?: {
    category?: string;
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const calendarCustomEventSchema = new Schema<ICalendarCustomEvent>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "upcomingEmi",
        "overdueEmi",
        "loanMaturity",
        "statusApprovalDeadline",
        "repaymentDue",
        "bulkRepaymentSession",
        "csvUploadBatch",
        "collateralDeposit",
        "collateralReturnSale",
        "borrowerActionItem",
        "portfolioAtRisk",
        "collateralLinkExpiry",
      ],
      default: "borrowerActionItem",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    dateStart: { type: Date, required: true, index: true },
    dateEnd: { type: Date, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      required: true,
    },
    sourceEntityType: {
      type: String,
      enum: ["loan", "collateral", "borrower", "repayment", "portfolio"],
      default: "borrower",
      required: true,
    },
    sourceEntityId: { type: String, default: "custom" },
    sourceEntityData: {
      loanId: { type: String },
      borrowerId: { type: String },
      collateralId: { type: String },
      borrowerName: { type: String },
      loanAmount: { type: Number },
      overdueAmount: { type: Number },
      daysOverdue: { type: Number },
    },
    deepLinkPath: { type: String, default: "/calendar" },
    deepLinkParams: { type: Schema.Types.Mixed },
    displayColor: {
      type: String,
      enum: ["blue", "green", "yellow", "red", "orange", "purple"],
      default: "yellow",
      required: true,
    },
    displayIcon: {
      type: String,
      enum: [
        "calendar",
        "alertCircle",
        "checkCircle",
        "clock",
        "creditCard",
        "package",
        "fileText",
        "plus",
        "trending",
        "link",
      ],
      default: "plus",
      required: true,
    },
    customMeta: {
      category: { type: String, trim: true },
      tags: [{ type: String, trim: true }],
    },
  },
  {
    timestamps: true,
  }
);

calendarCustomEventSchema.index({ createdBy: 1, dateStart: 1 });
calendarCustomEventSchema.index({ createdBy: 1, "customMeta.category": 1 });
calendarCustomEventSchema.index({ createdBy: 1, "customMeta.tags": 1 });

export default mongoose.model<ICalendarCustomEvent>(
  "CalendarCustomEvent",
  calendarCustomEventSchema
);
