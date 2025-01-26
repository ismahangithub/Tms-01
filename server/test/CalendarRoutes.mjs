import { Router } from "express";
import { getProjectTimelines, getTaskTimelines, getGlobalHolidays } from "../controller/calendarController.mjs";

const router = Router();

// Calendar routes
router.get("/calendar/projects", getProjectTimelines); // Get project timelines
router.get("/calendar/tasks", getTaskTimelines); // Get task timelines
router.get("/calendar/holidays", getGlobalHolidays); // Get global holidays

export default router;
