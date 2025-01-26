import Department from "../models/Department.mjs";
import User from "../models/user.mjs";
import Project from "../models/Project Model.mjs";
import mongoose from "mongoose";

// Escape regex special characters for robust search
const escapeRegex = (string) =>
  string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

// Create a new department
export const createDepartment = async (req, res) => {
  console.log("createDepartment triggered.");
  try {
    const { name, description, color } = req.body;

    // Log input data
    console.log("Request body:", req.body);

    // Validate unique name (case-insensitive)
    const existingDepartment = await Department.findOne({
      name: new RegExp(`^${escapeRegex(name)}$`, "i"),
    });
    if (existingDepartment) {
      console.warn("Department name must be unique:", name);
      return res.status(400).json({ message: "Department name must be unique." });
    }

    // Validate HEX color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (color && !hexColorRegex.test(color)) {
      console.warn("Invalid HEX color format:", color);
      return res.status(400).json({ message: "Invalid color format. Provide a valid HEX code." });
    }

    // Create department
    const department = new Department({ name, description, color });
    await department.save();
    console.log("Department created successfully:", department);

    res.status(201).json({ message: "Department created successfully", department });
  } catch (error) {
    console.error("Error creating department:", error.message);
    res.status(500).json({ message: "Failed to create department" });
  }
};

// Get all departments
export const getDepartments = async (req, res) => {
  console.log("getDepartments triggered.");
  try {
    // Log the query parameters if any
    console.log("Query parameters:", req.query);

    // Fetch departments
    console.log("Fetching departments...");
    const departments = await Department.find();
    console.log("Departments fetched successfully:", departments);

    res.status(200).json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error.message);
    res.status(500).json({ message: "Failed to fetch departments" });
  }
};

// Get department by ID
export const getDepartmentById = async (req, res) => {
  console.log("getDepartmentById triggered. ID:", req.params.id);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    console.warn("Invalid department ID:", req.params.id);
    return res.status(400).json({ message: "Invalid department ID." });
  }

  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      console.warn("Department not found. ID:", req.params.id);
      return res.status(404).json({ message: "Department not found" });
    }

    console.log("Department fetched successfully:", department);
    res.status(200).json(department);
  } catch (error) {
    console.error("Error fetching department:", error.message);
    res.status(500).json({ message: "Failed to fetch department" });
  }
};

// Update a department
export const updateDepartment = async (req, res) => {
  console.log("updateDepartment triggered. ID:", req.params.id);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    console.warn("Invalid department ID:", req.params.id);
    return res.status(400).json({ message: "Invalid department ID." });
  }

  try {
    const { name, description, color } = req.body;

    console.log("Request body:", req.body);

    // Validate unique name (case-insensitive)
    if (name) {
      const existingDepartment = await Department.findOne({
        name: new RegExp(`^${escapeRegex(name)}$`, "i"),
        _id: { $ne: req.params.id }, // Exclude current department
      });
      if (existingDepartment) {
        console.warn("Department name must be unique:", name);
        return res.status(400).json({ message: "Department name must be unique." });
      }
    }

    // Validate HEX color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (color && !hexColorRegex.test(color)) {
      console.warn("Invalid HEX color format:", color);
      return res.status(400).json({ message: "Invalid color format. Please provide a valid HEX color code." });
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description, color },
      { new: true, runValidators: true }
    );

    if (!department) {
      console.warn("Department not found. ID:", req.params.id);
      return res.status(404).json({ message: "Department not found" });
    }

    console.log("Department updated successfully:", department);
    res.status(200).json({ message: "Department updated successfully", department });
  } catch (error) {
    console.error("Error updating department:", error.message);
    res.status(500).json({ message: "Failed to update department" });
  }
};

// Delete a department
export const deleteDepartment = async (req, res) => {
  console.log("deleteDepartment triggered. ID:", req.params.id);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    console.warn("Invalid department ID:", req.params.id);
    return res.status(400).json({ message: "Invalid department ID." });
  }

  try {
    const isReferencedInUsers = await User.exists({ department: req.params.id });
    const isReferencedInProjects = await Project.exists({ department: req.params.id });

    if (isReferencedInUsers || isReferencedInProjects) {
      console.warn("Cannot delete department. Referenced by users or projects.");
      return res.status(400).json({
        message: "Cannot delete department. It is referenced by existing users or projects.",
      });
    }

    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      console.warn("Department not found. ID:", req.params.id);
      return res.status(404).json({ message: "Department not found" });
    }

    console.log("Department deleted successfully:", department);
    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error.message);
    res.status(500).json({ message: "Failed to delete department" });
  }
};
