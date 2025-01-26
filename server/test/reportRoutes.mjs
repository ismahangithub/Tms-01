import express from "express";
import { getReport } from "../controller/reportController.mjs";
import { validateReportQuery } from "../middleware/reportValidation.mjs";

const router = express.Router();

// Fetch reports
router.get("/reports", validateReportQuery, getReport);

export default router;
