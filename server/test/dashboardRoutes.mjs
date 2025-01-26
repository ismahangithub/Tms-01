import express from "express";
import { getDashboardData  } from "../controller/dashboardController.mjs";
import { isAdmin } from "../middleware/isAdmin.mjs";

const router = express.Router();

// Fetch dashboard data
router.get("/dashboard", isAdmin, getDashboardData );

export default router;
