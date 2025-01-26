// src/routes/meetingRoutes.mjs

import express from "express";
import { createMeeting, getAllMeetings } from "../controller/meetingController.mjs";

const router = express.Router();

// POST /api/meetings - Create a new meeting
router.post("/", createMeeting);

// GET /api/meetings - Get all meetings
router.get("/", getAllMeetings);

// Optionally, add other routes (e.g., GET by ID, DELETE, etc.)

export default router;
