import { Router } from "express";
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from "../controller/departmentController.mjs";
import { isAdmin } from "../middleware/isAdmin.mjs";

const router = Router();

// Admin-Protected Routes for Departments
router.post("/", isAdmin, createDepartment);
router.get("/", getDepartments); // Removed `isAdmin` to allow access for users
router.get("/:id", isAdmin, getDepartmentById);
router.put("/:id", isAdmin, updateDepartment);
router.delete("/:id", isAdmin, deleteDepartment);

export default router;
