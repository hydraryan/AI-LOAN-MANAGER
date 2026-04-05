import { Request, Response } from "express";
import mongoose from "mongoose";
import { Loan, Borrower } from "../models";
import Collateral from "../models/Collateral";

export type CalendarEventType =
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

export interface ICalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  description: string;
  dateStart: Date;
  dateEnd: Date;
  severity: "low" | "medium" | "high" | "critical";
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
}

// Helper: Generate upcoming/overdue/maturity events from loan schedules
async function generateLoanScheduleEvents(
  startDate: Date,
  endDate: Date
): Promise<ICalendarEvent[]> {
  const events: ICalendarEvent[] = [];

  // Fetch all loans with schedules in the date range
  const loans = await Loan.find({
    status: { $in: ["active", "pending", "approved"] },
  })
    .populate("borrowerId")
    .lean();

  const now = new Date();

  loans.forEach((loan: any) => {
    if (!loan.schedule || loan.schedule.length === 0) return;

    loan.schedule.forEach((schedule: any, index: number) => {
      const { dueDate, amount, paidAmount, status } = schedule;
      const dueDateTime = new Date(dueDate);

      // Skip if outside range
      if (dueDateTime < startDate || dueDateTime > endDate) return;

      const borrowerName = loan.borrowerId?.name || "Unknown Borrower";
      const borrowerId = loan.borrowerId?._id?.toString() || "";

      // Type B: Overdue EMI
      if (status === "overdue" && dueDateTime < now) {
        const daysOverdue = Math.floor(
          (now.getTime() - dueDateTime.getTime()) / (1000 * 60 * 60 * 24)
        );
        const outstanding = amount - (paidAmount || 0);

        let severity: "high" | "critical" = "high";
        let displayColor: "red" | "orange" = "orange";
        if (daysOverdue > 90) {
          severity = "critical";
          displayColor = "red";
        } else if (daysOverdue > 30) {
          displayColor = "red";
        }

        events.push({
          id: `overdueEmi-${loan._id}-${index}`,
          type: "overdueEmi",
          title: `Overdue EMI - ${borrowerName}`,
          description: `₹${outstanding} overdue for ${daysOverdue} days`,
          dateStart: dueDateTime,
          dateEnd: dueDateTime,
          severity,
          sourceEntityType: "loan",
          sourceEntityId: loan._id.toString(),
          sourceEntityData: {
            loanId: loan._id.toString(),
            borrowerId,
            borrowerName,
            loanAmount: loan.principal,
            overdueAmount: outstanding,
            daysOverdue,
          },
          deepLinkPath: `/loans/${loan._id}`,
          deepLinkParams: {
            highlight: "overdue",
          },
          displayColor,
          displayIcon: "alertCircle",
        });
      }

      // Type A: Upcoming EMI (pending, due within 7 days)
      if (status === "pending" && dueDateTime >= now) {
        const daysUntilDue = Math.floor(
          (dueDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const outstanding = amount - (paidAmount || 0);

        events.push({
          id: `upcomingEmi-${loan._id}-${index}`,
          type: "upcomingEmi",
          title: `Upcoming EMI - ${borrowerName}`,
          description: `₹${outstanding} due in ${daysUntilDue + 1} days`,
          dateStart: dueDateTime,
          dateEnd: dueDateTime,
          severity: daysUntilDue <= 3 ? "medium" : "low",
          sourceEntityType: "loan",
          sourceEntityId: loan._id.toString(),
          sourceEntityData: {
            loanId: loan._id.toString(),
            borrowerId,
            borrowerName,
            loanAmount: loan.principal,
            overdueAmount: outstanding,
          },
          deepLinkPath: `/loans/${loan._id}`,
          deepLinkParams: {
            scroll: "schedule",
          },
          displayColor: daysUntilDue <= 3 ? "orange" : "blue",
          displayIcon: "clock",
        });

        // Type E: Repayment Due (same as upcoming EMI but labeled differently)
        if (daysUntilDue <= 7) {
          events.push({
            id: `repaymentDue-${loan._id}-${index}`,
            type: "repaymentDue",
            title: `Repayment Due - ${borrowerName}`,
            description: `EMI payment due on ${dueDateTime.toLocaleDateString()}`,
            dateStart: dueDateTime,
            dateEnd: dueDateTime,
            severity: "medium",
            sourceEntityType: "repayment",
            sourceEntityId: loan._id.toString(),
            sourceEntityData: {
              loanId: loan._id.toString(),
              borrowerId,
              borrowerName,
            },
            deepLinkPath: `/repayments/view`,
            deepLinkParams: {
              loanId: loan._id.toString(),
            },
            displayColor: "yellow",
            displayIcon: "creditCard",
          });
        }
      }
    });

    // Type C: Loan Maturity Date (last schedule)
    if (loan.schedule.length > 0) {
      const lastSchedule = loan.schedule[loan.schedule.length - 1];
      const maturityDate = new Date(lastSchedule.dueDate);

      if (maturityDate >= startDate && maturityDate <= endDate) {
        const borrowerName = loan.borrowerId?.name || "Unknown Borrower";
        const borrowerId = loan.borrowerId?._id?.toString() || "";
        const daysUntilMaturity = Math.floor(
          (maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        events.push({
          id: `loanMaturity-${loan._id}`,
          type: "loanMaturity",
          title: `Loan Maturity - ${borrowerName}`,
          description: `Loan tenure completes on ${maturityDate.toLocaleDateString()}`,
          dateStart: maturityDate,
          dateEnd: maturityDate,
          severity: daysUntilMaturity <= 30 ? "medium" : "low",
          sourceEntityType: "loan",
          sourceEntityId: loan._id.toString(),
          sourceEntityData: {
            loanId: loan._id.toString(),
            borrowerId,
            borrowerName,
            loanAmount: loan.principal,
          },
          deepLinkPath: `/loans/${loan._id}`,
          deepLinkParams: {
            focus: "maturity",
          },
          displayColor: daysUntilMaturity <= 30 ? "orange" : "green",
          displayIcon: "checkCircle",
        });
      }
    }

    // Type D: Status Approval Deadline (pending loans older than 7 days)
    if (loan.status === "pending") {
      const createdAt = new Date(loan.createdAt);
      const ageInDays = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (ageInDays > 0) {
        const deadlineDate = new Date(createdAt);
        deadlineDate.setDate(deadlineDate.getDate() + 7); // SLA: 7 days

        if (deadlineDate >= startDate && deadlineDate <= endDate) {
          const borrowerName = loan.borrowerId?.name || "Unknown Borrower";
          const borrowerId = loan.borrowerId?._id?.toString() || "";

          events.push({
            id: `statusApprovalDeadline-${loan._id}`,
            type: "statusApprovalDeadline",
            title: `Approval Deadline - ${borrowerName}`,
            description: `Loan approval SLA expires on ${deadlineDate.toLocaleDateString()}`,
            dateStart: deadlineDate,
            dateEnd: deadlineDate,
            severity: ageInDays > 5 ? "high" : "medium",
            sourceEntityType: "loan",
            sourceEntityId: loan._id.toString(),
            sourceEntityData: {
              loanId: loan._id.toString(),
              borrowerId,
              borrowerName,
            },
            deepLinkPath: `/loans/${loan._id}`,
            deepLinkParams: {
              jumpToStatus: "true",
            },
            displayColor: ageInDays > 5 ? "red" : "orange",
            displayIcon: "alertCircle",
          });
        }
      }
    }
  });

  return events;
}

// Helper: Generate collateral-related events
async function generateCollateralEvents(
  startDate: Date,
  endDate: Date
): Promise<ICalendarEvent[]> {
  const events: ICalendarEvent[] = [];

  const collaterals = await Collateral.find()
    .populate("borrowerId")
    .populate("loanId")
    .lean();

  const now = new Date();

  collaterals.forEach((collateral: any) => {
    const borrowerName = collateral.borrowerId?.name || "Unknown Borrower";
    const borrowerId = collateral.borrowerId?._id?.toString() || "";

    // Type H: Collateral Deposit
    if (collateral.dateDeposited) {
      const depositDate = new Date(collateral.dateDeposited);
      if (depositDate >= startDate && depositDate <= endDate) {
        events.push({
          id: `collateralDeposit-${collateral._id}`,
          type: "collateralDeposit",
          title: `Collateral Deposited - ${collateral.productName}`,
          description: `₹${collateral.value} deposited by ${borrowerName}`,
          dateStart: depositDate,
          dateEnd: depositDate,
          severity: "low",
          sourceEntityType: "collateral",
          sourceEntityId: collateral._id.toString(),
          sourceEntityData: {
            collateralId: collateral._id.toString(),
            borrowerId,
            borrowerName,
            loanAmount: collateral.value,
          },
          deepLinkPath: `/collateral/view`,
          deepLinkParams: {
            collateralId: collateral._id.toString(),
          },
          displayColor: "green",
          displayIcon: "plus",
        });
      }
    }

    // Type I: Collateral Return/Sale (when status changes or linked loan closes)
    if (
      collateral.loanId &&
      (collateral.status === "Returned" || collateral.status === "Sold")
    ) {
      // Use updatedAt as proxy for return/sale date
      const returnDate = new Date(collateral.updatedAt || collateral.createdAt);
      if (returnDate >= startDate && returnDate <= endDate) {
        const actionType =
          collateral.status === "Returned" ? "Released" : "Sold";
        events.push({
          id: `collateralReturnSale-${collateral._id}`,
          type: "collateralReturnSale",
          title: `Collateral ${actionType} - ${collateral.productName}`,
          description: `${actionType} collateral worth ₹${collateral.value}`,
          dateStart: returnDate,
          dateEnd: returnDate,
          severity: "low",
          sourceEntityType: "collateral",
          sourceEntityId: collateral._id.toString(),
          sourceEntityData: {
            collateralId: collateral._id.toString(),
            borrowerId,
            borrowerName,
          },
          deepLinkPath: `/collateral/view`,
          deepLinkParams: {
            collateralId: collateral._id.toString(),
            action: "status",
          },
          displayColor: "blue",
          displayIcon: "link",
        });
      }
    }

    // Type L: Collateral Link Expiry (when linked loan closes or defaults)
    if (collateral.loanId && collateral.loanId.status) {
      const loanStatus = collateral.loanId.status;
      if (["closed", "paid", "defaulted"].includes(loanStatus)) {
        const expiryDate = new Date(collateral.loanId.updatedAt);
        if (expiryDate >= startDate && expiryDate <= endDate) {
          const reason =
            loanStatus === "defaulted"
              ? "linked loan defaulted"
              : "linked loan closed";
          events.push({
            id: `collateralLinkExpiry-${collateral._id}`,
            type: "collateralLinkExpiry",
            title: `Collateral Link Expiry - ${collateral.productName}`,
            description: `Action required: ${reason}`,
            dateStart: expiryDate,
            dateEnd: expiryDate,
            severity: loanStatus === "defaulted" ? "critical" : "medium",
            sourceEntityType: "collateral",
            sourceEntityId: collateral._id.toString(),
            sourceEntityData: {
              collateralId: collateral._id.toString(),
              borrowerId,
              borrowerName,
            },
            deepLinkPath: `/collateral/view`,
            deepLinkParams: {
              loanId: collateral.loanId._id.toString(),
            },
            displayColor: loanStatus === "defaulted" ? "red" : "orange",
            displayIcon: "alertCircle",
          });
        }
      }
    }
  });

  return events;
}

// Helper: Generate borrower action items
async function generateBorrowerActionItems(
  startDate: Date,
  endDate: Date
): Promise<ICalendarEvent[]> {
  const events: ICalendarEvent[] = [];
  const now = new Date();

  const borrowers = await Borrower.find().lean();

  for (const borrower of borrowers) {
    const borrowerLoans = await Loan.find({
      borrowerId: borrower._id,
      status: { $in: ["active", "pending", "approved"] },
    }).lean();

    const overdueLoanCount = borrowerLoans.filter((loan: any) => {
      return loan.schedule?.some((s: any) => s.status === "overdue");
    }).length;

    if (overdueLoanCount > 0) {
      // Type J: Borrower Action Items (overdue)
      const actionDate = new Date(now);
      actionDate.setHours(0, 0, 0, 0); // Today

      if (actionDate >= startDate && actionDate <= endDate) {
        const actionEvent: ICalendarEvent = {
          id: `borrowerActionItem-${borrower._id}`,
          type: "borrowerActionItem",
          title: `Collection Action - ${borrower.name}`,
          description: `${overdueLoanCount} loan(s) with overdue EMIs`,
          dateStart: actionDate,
          dateEnd: actionDate,
          severity: "high",
          sourceEntityType: "borrower",
          sourceEntityId: borrower._id.toString(),
          sourceEntityData: {
            borrowerId: borrower._id.toString(),
            ...(borrower.name && { borrowerName: borrower.name }),
          },
          deepLinkPath: `/borrowers/profile/${borrower._id}`,
          deepLinkParams: {
            actionType: "overdue",
          },
          displayColor: "red",
          displayIcon: "alertCircle",
        };
        events.push(actionEvent);
      }
    }
  }

  return events;
}

// Main export controller function
export const getCalendarEvents = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, eventTypes, borrowerId, loanId, severity } =
      req.query;

    // Validation: Both dates required
    if (!startDate || !endDate) {
      return res.status(400).json({
        ok: false,
        error:
          "startDate and endDate query parameters are required (ISO format)",
      });
    }

    const start = new Date(String(startDate));
    const end = new Date(String(endDate));

    // Validation: Date range sanity
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        ok: false,
        error: "Invalid date format. Use ISO format (YYYY-MM-DD)",
      });
    }

    if (start > end) {
      return res.status(400).json({
        ok: false,
        error: "startDate must be before endDate",
      });
    }

    // Max range: 366 days
    const daysDiff = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 366) {
      return res.status(400).json({
        ok: false,
        error:
          "Date range cannot exceed 366 days. Please narrow your query.",
      });
    }

    // Fetch all events in parallel
    const [loanEvents, collateralEvents, borrowerEvents] = await Promise.all([
      generateLoanScheduleEvents(start, end),
      generateCollateralEvents(start, end),
      generateBorrowerActionItems(start, end),
    ]);

    let allEvents: ICalendarEvent[] = [
      ...loanEvents,
      ...collateralEvents,
      ...borrowerEvents,
    ];

    // Apply filters
    if (eventTypes) {
      const eventTypeList = String(eventTypes)
        .split(",")
        .map((t) => t.trim());
      allEvents = allEvents.filter((e) => eventTypeList.includes(e.type));
    }

    if (borrowerId && mongoose.Types.ObjectId.isValid(String(borrowerId))) {
      allEvents = allEvents.filter(
        (e) =>
          e.sourceEntityData?.borrowerId === String(borrowerId) ||
          e.sourceEntityId === String(borrowerId)
      );
    }

    if (loanId && mongoose.Types.ObjectId.isValid(String(loanId))) {
      allEvents = allEvents.filter(
        (e) => e.sourceEntityData?.loanId === String(loanId)
      );
    }

    if (severity) {
      const severityList = String(severity)
        .split(",")
        .map((s) => s.trim());
      allEvents = allEvents.filter((e) => severityList.includes(e.severity));
    }

    // Sort by date
    allEvents.sort((a, b) => a.dateStart.getTime() - b.dateStart.getTime());

    return res.status(200).json({
      ok: true,
      data: {
        events: allEvents,
        count: allEvents.length,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Calendar events fetch error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch calendar events",
    });
  }
};
