import mongoose from "mongoose";
import Department from "../models/Department.mjs";
import User from "../models/User.mjs";
import Project from "../models/Project Model.mjs";

const escapeRegex = (string) =>
  string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

// Create a new department
export const createDepartment = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    // Check uniqueness (case-insensitive)
    const existingDepartment = await Department.findOne({
      name: new RegExp(`^${escapeRegex(name)}$`, "i"),
    });
    if (existingDepartment) {
      return res
        .status(400)
        .json({ message: "Department name must be unique." });
    }

    // Basic color check
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (color && !hexColorRegex.test(color)) {
      return res.status(400).json({
        message: "Invalid color format. Provide a valid 6-digit HEX code.",
      });
    }

    const department = new Department({ name, description, color });
    await department.save();

    return res
      .status(201)
      .json({ message: "Department created successfully", department });
  } catch (error) {
    console.error("Error creating department:", error.message);
    return res.status(500).json({ message: "Failed to create department" });
  }
};

// Get all departments
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    return res.status(200).json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error.message);
    return res.status(500).json({ message: "Failed to fetch departments" });
  }
};

// Get department by ID
export const getDepartmentById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid department ID." });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    return res.status(200).json(department);
  } catch (error) {
    console.error("Error fetching department:", error.message);
    return res.status(500).json({ message: "Failed to fetch department" });
  }
};

// Update a department
export const updateDepartment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid department ID." });
    }

    const { name, description, color } = req.body;

    if (name) {
      // Ensure uniqueness
      const existingDepartment = await Department.findOne({
        name: new RegExp(`^${escapeRegex(name)}$`, "i"),
        _id: { $ne: req.params.id },
      });
      if (existingDepartment) {
        return res
          .status(400)
          .json({ message: "Department name must be unique." });
      }
    }

    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (color && !hexColorRegex.test(color)) {
      return res.status(400).json({
        message: "Invalid color format. Please provide a valid HEX color code.",
      });
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description, color },
      { new: true, runValidators: true }
    );
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    return res
      .status(200)
      .json({ message: "Department updated successfully", department });
  } catch (error) {
    console.error("Error updating department:", error.message);
    return res.status(500).json({ message: "Failed to update department" });
  }
};

// Delete a department
export const deleteDepartment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid department ID." });
    }

    // Check references
    const isReferencedInUsers = await User.exists({ department: req.params.id });
    const isReferencedInProjects = await Project.exists({
      departments: req.params.id, // must match the array field "departments"
    });

    if (isReferencedInUsers || isReferencedInProjects) {
      return res.status(400).json({
        message:
          "Cannot delete department. It is referenced by existing users or projects.",
      });
    }

    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    return res
      .status(200)
      .json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error.message);
    return res.status(500).json({ message: "Failed to delete department" });
  }
};
