import express from "express";
import {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
} from "../controller/reportController.mjs";

const router = express.Router();

// Routes for report actions
router.post("/", createReport); // Create a new report
router.get("/", getReports);    // Get all reports
router.get("/:id", getReportById);  // Get a single report by ID
router.put("/:id", updateReport);   // Update a report by ID
router.delete("/:id", deleteReport); // Delete a report by ID

export default router;
