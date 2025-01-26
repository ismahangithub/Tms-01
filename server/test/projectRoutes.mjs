import express from "express";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from "../controller/projectController.mjs";
import { isAdmin } from "../middleware/isAdmin.mjs"; // Middleware to validate admin role
import { validateProjectPayload } from "../middleware/validateProject.mjs"; // Middleware to validate project payload

const router = express.Router();

// Middleware to log incoming requests
router.use((req, res, next) => {
  console.log(`Project Route -> ${req.method}: ${req.originalUrl}`);
  next();
});

// Create a new project (Admin-protected route)
router.post("/", isAdmin, validateProjectPayload, createProject);

// Update an existing project by ID (Admin-protected route)
router.put("/:id", isAdmin, validateProjectPayload, updateProject);

// Delete a project by ID (Admin-protected route)
router.delete("/:id", isAdmin, deleteProject);

// Fetch all projects or a specific project by ID
router.get("/:id?", getProjects); // Handles both /projects and /projects/:id

export default router;
