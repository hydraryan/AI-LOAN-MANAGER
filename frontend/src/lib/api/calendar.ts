import API from "./api";

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
  dateStart: string; // ISO date string
  dateEnd: string; // ISO date string
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
  displayColor:
    | "blue"
    | "green"
    | "yellow"
    | "red"
    | "orange"
    | "purple";
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

export type CalendarEventsResponse = {
  ok: boolean;
  data: {
    events: ICalendarEvent[];
    count: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
};

export interface CalendarQueryParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  eventTypes?: string[]; // Array of event type names
  borrowerId?: string;
  loanId?: string;
  severity?: string[]; // Array of severity levels
}

export type CustomEventMeta = {
  category?: string;
  tags?: string[];
};

export type CustomCalendarEventPayload = {
  type?: CalendarEventType;
  title: string;
  description?: string;
  dateStart: string;
  dateEnd: string;
  severity: "low" | "medium" | "high" | "critical";
  sourceEntityType?: "loan" | "collateral" | "borrower" | "repayment" | "portfolio";
  sourceEntityId?: string;
  sourceEntityData?: ICalendarEvent["sourceEntityData"];
  deepLinkPath?: string;
  deepLinkParams?: Record<string, string>;
  displayColor?: ICalendarEvent["displayColor"];
  displayIcon?: ICalendarEvent["displayIcon"];
  customMeta?: CustomEventMeta;
};

/**
 * Fetch calendar events for a given date range
 * @param params Query parameters including required startDate and endDate
 * @returns Array of calendar events sorted by date
 */
export const getCalendarEvents = async (
  params: CalendarQueryParams
): Promise<ICalendarEvent[]> => {
  const queryParams = new URLSearchParams();

  // Build query string
  queryParams.append("startDate", params.startDate);
  queryParams.append("endDate", params.endDate);

  if (params.eventTypes && params.eventTypes.length > 0) {
    queryParams.append("eventTypes", params.eventTypes.join(","));
  }

  if (params.borrowerId) {
    queryParams.append("borrowerId", params.borrowerId);
  }

  if (params.loanId) {
    queryParams.append("loanId", params.loanId);
  }

  if (params.severity && params.severity.length > 0) {
    queryParams.append("severity", params.severity.join(","));
  }

  const res = await API.get<CalendarEventsResponse>(
    `/calendar/events?${queryParams.toString()}`
  );

  return res.data.data?.events || [];
};

/**
 * Get calendar events for the current month
 */
export const getCalendarEventsForMonth = async (
  year: number,
  month: number
): Promise<ICalendarEvent[]> => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  return getCalendarEvents({
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  });
};

/**
 * Get calendar events for the current week
 */
export const getCalendarEventsForWeek = async (
  date: Date
): Promise<ICalendarEvent[]> => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

  return getCalendarEvents({
    startDate: startOfWeek.toISOString().split("T")[0],
    endDate: endOfWeek.toISOString().split("T")[0],
  });
};

/**
 * Get calendar events for a specific date
 */
export const getCalendarEventsForDate = async (
  date: Date
): Promise<ICalendarEvent[]> => {
  const dateStr = date.toISOString().split("T")[0];
  return getCalendarEvents({
    startDate: dateStr,
    endDate: dateStr,
  });
};

/**
 * Get critical/high severity events for the next 7 days
 */
export const getUpcomingCriticalEvents = async (): Promise<ICalendarEvent[]> => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 7);

  return getCalendarEvents({
    startDate: today.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    severity: ["high", "critical"],
  });
};

export const getCustomCalendarEvents = async (
  params: {
    startDate?: string;
    endDate?: string;
    borrowerId?: string;
    loanId?: string;
    category?: string;
    tag?: string;
  } = {}
): Promise<ICalendarEvent[]> => {
  const queryParams = new URLSearchParams();

  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);
  if (params.borrowerId) queryParams.append("borrowerId", params.borrowerId);
  if (params.loanId) queryParams.append("loanId", params.loanId);
  if (params.category) queryParams.append("category", params.category);
  if (params.tag) queryParams.append("tag", params.tag);

  const query = queryParams.toString();
  const res = await API.get<{ ok: boolean; data: { events: ICalendarEvent[] } }>(
    `/calendar/custom-events${query ? `?${query}` : ""}`
  );

  return res.data.data?.events || [];
};

export const createCustomCalendarEvent = async (
  payload: CustomCalendarEventPayload
): Promise<ICalendarEvent> => {
  const res = await API.post<{ ok: boolean; data: ICalendarEvent }>(
    "/calendar/custom-events",
    payload
  );
  return res.data.data;
};

export const createCustomCalendarEventsBulk = async (
  events: CustomCalendarEventPayload[]
): Promise<ICalendarEvent[]> => {
  const res = await API.post<{
    ok: boolean;
    data: { events: ICalendarEvent[] };
  }>("/calendar/custom-events/bulk", { events });
  return res.data.data?.events || [];
};

export const updateCustomCalendarEvent = async (
  id: string,
  payload: Partial<CustomCalendarEventPayload>
): Promise<ICalendarEvent> => {
  const res = await API.put<{ ok: boolean; data: ICalendarEvent }>(
    `/calendar/custom-events/${id}`,
    payload
  );
  return res.data.data;
};

export const deleteCustomCalendarEvent = async (id: string): Promise<void> => {
  await API.delete(`/calendar/custom-events/${id}`);
};

export const bulkDeleteCustomCalendarEvents = async (
  ids: string[]
): Promise<void> => {
  await API.post("/calendar/custom-events/bulk-delete", { ids });
};

export const bulkUpdateCustomCalendarEventMeta = async (
  ids: string[],
  payload: { category?: string; tags?: string[] }
): Promise<void> => {
  await API.post("/calendar/custom-events/bulk-update-meta", { ids, ...payload });
};
