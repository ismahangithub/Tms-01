import moment from "moment";
import Task from "../models/Task.mjs";
// import Project from "../models/ProjectModel.mjs";
import User from "../models/user.mjs";
import { sendAssignmentEmail } from "../Utilits/emailService.mjs";
import Project from "../models/Project Model.mjs";

export const createTask = async (req, res) => {
  try {
    const { taskName, description, dueDate, priority, project, assignedTo } = req.body;

    if (!taskName || !dueDate || !priority || !project || !assignedTo || assignedTo.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const associatedProject = await Project.findById(project);
    if (!associatedProject) {
      return res.status(404).json({ message: "Associated project not found" });
    }

    if (moment(dueDate).isAfter(moment(associatedProject.dueDate))) {
      return res.status(400).json({ message: "Task due date cannot exceed the project's due date" });
    }

    const assignedUsers = await User.find({ _id: { $in: assignedTo } }, "email firstName lastName");
    if (assignedUsers.length === 0) {
      return res.status(400).json({ message: "No valid users found for the assigned IDs" });
    }

    const newTask = new Task({
      taskName,
      description,
      dueDate,
      priority,
      project,
      assignedTo,
      status: "Pending",
    });

    await newTask.save();

    for (const user of assignedUsers) {
      try {
        await sendAssignmentEmail(user.email, taskName, dueDate);
      } catch (error) {
        console.error(`Failed to send email to ${user.email}: ${error.message}`);
      }
    }

    res.status(201).json({ message: "Task created successfully", newTask });
  } catch (error) {
    console.error("Error creating task:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = status ? { status: { $in: Array.isArray(status) ? status : [status] } } : {};

    const tasks = await Task.find(filter)
      .populate("assignedTo project", "firstName lastName name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const totalTasks = await Task.countDocuments(filter);

    res.status(200).json({
      tasks,
      pagination: {
        totalTasks,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTasks / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "assignedTo project",
      "firstName lastName name"
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error("Error fetching task:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { taskName, description, dueDate, priority, project, assignedTo, status } = req.body;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { taskName, description, dueDate, priority, project, assignedTo, status },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task updated successfully", updatedTask });
  } catch (error) {
    console.error("Error updating task:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const markTaskAsCompleted = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status: "Completed" },
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task marked as completed", task });
  } catch (error) {
    console.error("Error marking task as completed:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
