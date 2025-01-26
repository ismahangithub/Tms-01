// server/routes/index.mjs
import { Router } from "express";
import userRouter from "./user.mjs";
import clientRouter from "./client.mjs";
import projectRoutes from "./projectRoutes.mjs";
import taskRoutes from "./taskRoutes.mjs";
import departmentRoutes from "./departmentRoutes.mjs";
import meetingRoutes from "./meetingRoutes.mjs";
import reportRoutes from "./reportRoutes.mjs";
import dashboardRoutes from "./dashboardRoutes.mjs";
import commentRoutes from "./commentRoutes.mjs"; // Ensure this file exists
import eventRoutes from "./eventRoutes.mjs";
import contactRoutes from "./contactRoutes.mjs"; // Contact routes added
import cron from "node-cron";

// Reminder functions
import { sendDailyProjectReminders } from "../controller/projectController.mjs";
import { sendDailyTaskReminders } from "../controller/taskController.mjs";

const router = Router();

// Logging middleware
router.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

// Mount sub-routes
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/users", userRouter);
router.use("/clients", clientRouter);
router.use("/departments", departmentRoutes);
router.use("/meetings", meetingRoutes);
router.use("/reports", reportRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/comments", commentRoutes);
router.use("/events", eventRoutes);
router.use("/contacts", contactRoutes); // Contact routes added

// Schedule daily reminder job at 8:00 AM every day
cron.schedule("0 8 * * *", async () => {
  console.log("Running daily reminder job...");
  await sendDailyProjectReminders();
  await sendDailyTaskReminders();
  console.log("Daily reminder job finished.");
});

// Fallback 404 handler
router.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "API endpoint not found",
  });
});

export default router;
