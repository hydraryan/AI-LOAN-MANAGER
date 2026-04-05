import express from "express";
import { getCalendarEvents } from "../controllers/calendarController";
import {
	bulkDeleteCustomCalendarEvents,
	bulkUpdateCustomCalendarEventMeta,
	createCustomCalendarEvent,
	createCustomCalendarEventsBulk,
	deleteCustomCalendarEvent,
	getCustomCalendarEvents,
	updateCustomCalendarEvent,
} from "../controllers/calendarCustomEventController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// GET /api/calendar/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&eventTypes=...&borrowerId=...&severity=...
router.get("/events", authMiddleware, getCalendarEvents);

// Server-backed custom events
router.get("/custom-events", authMiddleware, getCustomCalendarEvents);
router.post("/custom-events", authMiddleware, createCustomCalendarEvent);
router.post("/custom-events/bulk", authMiddleware, createCustomCalendarEventsBulk);
router.put("/custom-events/:id", authMiddleware, updateCustomCalendarEvent);
router.delete("/custom-events/:id", authMiddleware, deleteCustomCalendarEvent);
router.post("/custom-events/bulk-delete", authMiddleware, bulkDeleteCustomCalendarEvents);
router.post(
	"/custom-events/bulk-update-meta",
	authMiddleware,
	bulkUpdateCustomCalendarEventMeta
);

export default router;
