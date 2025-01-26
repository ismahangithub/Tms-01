import { Router } from "express";
import userRouter from "./user.mjs";
import clientRouter from "./client.mjs";
import projectRoutes from "./projectRoutes.mjs";
import taskRoutes from "./taskRoutes.mjs";
import departmentRoutes from "./departmentRoutes.mjs";

const router = Router();

// Log every request
router.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

// Mount individual routes
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/users", userRouter);
router.use("/clients", clientRouter);
router.use("/departments", departmentRoutes);

// Fallback for unmatched routes
router.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "API endpoint not found",
  });
});

export default router;
