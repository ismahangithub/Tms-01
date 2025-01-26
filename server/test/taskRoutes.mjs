import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  markTaskAsCompleted,
} from "../controller/taskController.mjs";

const router = express.Router();

// Task Routes
router.post("/", createTask); // Create a new task
router.get("/", getTasks); // Get all tasks
router.get("/:id", getTaskById); // Get task by ID
router.put("/:id", updateTask); // Update a task
router.patch("/:id/complete", markTaskAsCompleted); // Mark task as completed
router.delete("/:id", deleteTask); // Delete a task

export default router;
