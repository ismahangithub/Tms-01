import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controller/eventController.mjs";

const router = express.Router();

// POST /api/events - Create a new event
router.post("/", createEvent);

// GET /api/events - Get all events
router.get("/", getAllEvents);

// GET /api/events/:id - Get a specific event by ID
router.get("/:id", getEventById);

// PUT /api/events/:id - Update an event
router.put("/:id", updateEvent);

// DELETE /api/events/:id - Delete an event
router.delete("/:id", deleteEvent);

export default router;
