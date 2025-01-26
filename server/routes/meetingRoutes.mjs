// src/routes/meetingRoutes.mjs

import express from "express"; // Import express
import {
  createMeeting,
  getAllMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
} from "../controller/meetingController.mjs"; // Ensure the path is correct

const router = express.Router();

// POST /api/meetings - Create a new meeting
router.post("/", createMeeting);

// GET /api/meetings - Get all meetings
router.get("/", getAllMeetings);

// GET /api/meetings/:id - Get a specific meeting by ID
router.get("/:id", getMeetingById);

// PUT /api/meetings/:id - Update a meeting
router.put("/:id", updateMeeting);

// DELETE /api/meetings/:id - Delete a meeting
router.delete("/:id", deleteMeeting);

export default router;
