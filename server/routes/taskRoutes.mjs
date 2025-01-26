// server/routes/taskRoutes.mjs

import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  deleteManyTasks,
  markTaskAsCompleted,
} from "../controller/taskController.mjs";
import commentRoutes from "./commentRoutes.mjs"; // Adjust the path if necessary

const router = express.Router();

// Middleware to log incoming requests (optional)
router.use((req, res, next) => {
  console.log(`Task Route -> ${req.method}: ${req.originalUrl}`);
  next();
});

// Task Routes

// **Note**: These routes are not protected. If they should be, apply `authenticateUser` middleware.
router.post("/", createTask);
router.get("/", getTasks);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.patch("/:id/complete", markTaskAsCompleted);
router.delete("/:id", deleteTask);
router.delete("/", deleteManyTasks);

// Mount comment routes under /:taskId/comments
router.use("/:taskId/comments", commentRoutes);

export default router;
