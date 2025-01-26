import express from "express";
import { getDashboardData } from "../controller/dashboardController.mjs";
import { isAdmin } from "../middleware/isAdmin.mjs";

const router = express.Router();

/**
 * @route   GET /dashboard
 * @desc    Fetch aggregated dashboard data
 * @access  Admin
 */
router.get("/", isAdmin, getDashboardData);

export default router;
