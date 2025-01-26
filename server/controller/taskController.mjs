// server/controller/taskController.mjs

import moment from "moment";
import mongoose from "mongoose";
import Task from "../models/Task.mjs";
import Project from "../models/Project Model.mjs";
import User from "../models/User.mjs";
import Department from "../models/Department.mjs";
import { 
  sendAssignmentEmail,
  // Reuse "sendReminderEmail" for tasks
  sendReminderEmail, 
} from "../utilits/emailService.mjs";

/**
 * Helper function to map a Task document to a frontend-friendly object.
 */
const mapTaskData = (task) => {
  // Convert Departments array to { id, name } objects
  let finalDepartments = [];
  if (task.departments && Array.isArray(task.departments)) {
    finalDepartments = task.departments.map((dept) => ({
      id: dept._id?.toString() || "N/A",
      name: dept.name || "N/A",
      // color: dept.color, // Uncomment if color is stored in Department
    }));
  }

  // Overdue logic for final status
  let finalStatus = task.status;
  const now = new Date();
  if (
    task.dueDate &&
    new Date(task.dueDate) < now &&
    finalStatus !== "completed" &&
    finalStatus !== "overdue"
  ) {
    finalStatus = "overdue";
  }

  return {
    _id: task._id.toString(),
    title: task.taskName || "Untitled Task",
    description: task.description || "",
    status: finalStatus || "pending",
    dueDate: task.dueDate ? task.dueDate.toISOString() : "No due date",
    startDate: task.startDate ? task.startDate.toISOString() : null,
    members:
      task.assignedTo && task.assignedTo.length > 0
        ? task.assignedTo.map((u) => `${u.firstName} ${u.lastName}`)
        : ["None"],
    project: task.project ? task.project.name : "N/A",
    projectId: task.project ? task.project._id.toString() : "",
    createdAt: task.createdAt
      ? task.createdAt.toISOString()
      : new Date().toISOString(),
    priority: task.priority || "medium",
    departments: finalDepartments,
  };
};

/**
 * Create Task
 */
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      priority,
      project,
      departments,
      assignedTo,
      status = "pending",
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !dueDate ||
      !priority ||
      !project ||
      !departments ||
      !Array.isArray(departments) ||
      departments.length === 0 ||
      !assignedTo ||
      !Array.isArray(assignedTo) ||
      assignedTo.length === 0
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate Project ID
    if (!mongoose.Types.ObjectId.isValid(project)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    // Ensure the project exists
    const associatedProject = await Project.findById(project);
    if (!associatedProject) {
      return res.status(404).json({ message: "Associated project not found" });
    }

    // Make sure dueDate <= project's dueDate
    if (
      associatedProject.dueDate &&
      moment(dueDate).isAfter(moment(associatedProject.dueDate))
    ) {
      return res
        .status(400)
        .json({ message: "Task due date cannot exceed the project's due date" });
    }

    // Validate Departments
    const validDepartments = await Department.find({ _id: { $in: departments } });
    if (validDepartments.length !== departments.length) {
      return res
        .status(400)
        .json({ message: "One or more departments are invalid" });
    }

    // Verify assigned users are in these departments
    const usersInDepartments = await User.find({
      department: { $in: departments },
    });
    if (usersInDepartments.length === 0) {
      return res
        .status(400)
        .json({ message: "No users found in the selected departments" });
    }

    const validAssignedTo = assignedTo.filter((userId) =>
      usersInDepartments.some((user) => user._id.toString() === userId)
    );
    if (validAssignedTo.length === 0) {
      return res
        .status(400)
        .json({ message: "Cannot assign task to users outside chosen departments" });
    }
    if (validAssignedTo.length !== assignedTo.length) {
      return res.status(400).json({
        message:
          "Some assigned users do not belong to the selected departments.",
      });
    }

    // Create the new Task
    const newTask = new Task({
      taskName: title,
      description,
      dueDate,
      priority: priority.toLowerCase(),
      project,
      departments,
      assignedTo: validAssignedTo,
      status: status.toLowerCase(),
    });

    await newTask.save();
    console.log(`Task ${newTask._id} created and associated with Project ${project}`);

    // Send assignment emails asynchronously (fire-and-forget)
    const assignedUsers = usersInDepartments.filter((u) =>
      validAssignedTo.includes(u._id.toString())
    );
    assignedUsers.forEach((user) => {
      // Do not await; fire-and-forget the email sending
      sendAssignmentEmail(user.email, title, dueDate).catch((emailError) => {
        console.error(`Failed to send email to ${user.email}: ${emailError.message}`);
      });
    });

    // Populate the new Task for final response
    await newTask.populate([
      {
        path: "assignedTo",
        select: "firstName lastName email role department",
        populate: { path: "department", select: "name" },
      },
      {
        path: "project",
        select: "name client departments budget",
        populate: { path: "client", select: "name" },
      },
      {
        path: "departments",
        select: "name color",
      },
    ]);

    const mappedTask = mapTaskData(newTask);
    return res
      .status(201)
      .json({ message: "Task created successfully", tasks: [mappedTask] });
  } catch (error) {
    console.error("Error creating task:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get All Tasks with Optional Filtering & Pagination
 */
export const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, project, date, department } = req.query;
    const filter = {};

    // Filter by status
    if (status && status.toLowerCase() !== "all") {
      filter.status = {
        $in: Array.isArray(status)
          ? status.map((s) => s.toLowerCase())
          : [status.toLowerCase()],
      };
    }

    // Filter by project
    if (project && mongoose.Types.ObjectId.isValid(project)) {
      filter.project = project;
    }

    // Filter by department
    if (department) {
      if (Array.isArray(department)) {
        filter.departments = { $in: department };
      } else if (mongoose.Types.ObjectId.isValid(department)) {
        filter.departments = department;
      }
    }

    // Filter by dueDate
    if (date) {
      const today = moment().startOf("day");
      if (date === "today") {
        filter.dueDate = {
          $gte: today.toDate(),
          $lt: today.clone().add(1, "day").toDate(),
        };
      } else if (date === "week") {
        filter.dueDate = {
          $gte: today.toDate(),
          $lt: today.clone().add(1, "week").toDate(),
        };
      } else if (date === "month") {
        filter.dueDate = {
          $gte: today.toDate(),
          $lt: today.clone().add(1, "month").toDate(),
        };
      }
    }

    let query = Task.find(filter)
      .populate({
        path: "assignedTo",
        select: "firstName lastName email role department",
        populate: { path: "department", select: "name" },
      })
      .populate({
        path: "project",
        select: "name client departments budget",
        populate: { path: "client", select: "name" },
      })
      .populate({
        path: "departments",
        select: "name color",
      });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    query = query.skip(skip).limit(parseInt(limit));

    const tasks = await query.exec();
    const totalTasks = await Task.countDocuments(filter);

    // Map tasks
    const mappedTasks = tasks.map((t) => mapTaskData(t));
    return res.status(200).json({
      tasks: mappedTasks,
      pagination: {
        totalTasks,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTasks / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get Task by ID
 */
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate({
        path: "assignedTo",
        select: "firstName lastName email role department",
        populate: { path: "department", select: "name" },
      })
      .populate({
        path: "project",
        select: "name client departments budget",
        populate: { path: "client", select: "name" },
      })
      .populate({
        path: "departments",
        select: "name color",
      });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const mappedTask = mapTaskData(task);
    return res.status(200).json(mappedTask);
  } catch (error) {
    console.error("Error fetching task:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update Task
 */
export const updateTask = async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      priority,
      project,
      departments,
      assignedTo,
      status,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    // Fetch the task to update
    const taskToUpdate = await Task.findById(req.params.id).populate([
      {
        path: "assignedTo",
        select: "firstName lastName email role department",
        populate: { path: "department", select: "name" },
      },
      { path: "project", select: "name" },
      { path: "departments", select: "name color" },
    ]);

    if (!taskToUpdate) {
      return res.status(404).json({ message: "Task not found" });
    }

    // If project changed, validate
    if (project && project !== taskToUpdate.project.toString()) {
      if (!mongoose.Types.ObjectId.isValid(project)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const newProject = await Project.findById(project);
      if (!newProject) {
        return res
          .status(404)
          .json({ message: "New associated project not found" });
      }
      if (newProject.dueDate && moment(dueDate).isAfter(moment(newProject.dueDate))) {
        return res.status(400).json({
          message: "Task due date cannot exceed the new project's due date",
        });
      }
      taskToUpdate.project = project;
    }

    // Update departments if provided
    if (departments !== undefined) {
      const validDepartments = await Department.find({ _id: { $in: departments } });
      if (validDepartments.length !== departments.length) {
        return res.status(400).json({ message: "One or more departments are invalid" });
      }
      taskToUpdate.departments = departments;
    }

    // Update other fields if provided
    if (title !== undefined) taskToUpdate.taskName = title.trim();
    if (description !== undefined) taskToUpdate.description = description;
    if (dueDate !== undefined) taskToUpdate.dueDate = dueDate;
    if (priority !== undefined) taskToUpdate.priority = priority.toLowerCase();

    if (status !== undefined) {
      const allowedStatuses = ["pending", "in progress", "completed", "overdue"];
      if (!allowedStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      taskToUpdate.status = status.toLowerCase();
    }

    // Assign users if provided
    if (assignedTo !== undefined) {
      if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
        return res.status(400).json({ message: "AssignedTo must be a non-empty array" });
      }
      // Verify that each user is in the task's departments.
      // For simplicity, assume usersInDepartments is obtained from earlier in your logic.
      // (If not, you might need to refetch them here.)
      const usersInDepartments = await User.find({
        department: { $in: taskToUpdate.departments },
      });
      const validAssignedTo = assignedTo.filter((userId) =>
        usersInDepartments.some((u) => u._id.toString() === userId)
      );
      if (validAssignedTo.length === 0) {
        return res.status(400).json({
          message: "None of the assigned users belong to the selected departments.",
        });
      }
      taskToUpdate.assignedTo = validAssignedTo;
    }

    await taskToUpdate.save();
    await taskToUpdate.populate([
      {
        path: "assignedTo",
        select: "firstName lastName email role department",
        populate: { path: "department", select: "name" },
      },
      {
        path: "project",
        select: "name client departments budget",
        populate: { path: "client", select: "name" },
      },
      {
        path: "departments",
        select: "name color",
      },
    ]);

    const mappedTask = mapTaskData(taskToUpdate);
    return res
      .status(200)
      .json({ message: "Task updated successfully", tasks: [mappedTask] });
  } catch (error) {
    console.error("Error updating task:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Mark Task as Completed
 */
export const markTaskAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findById(id)
      .populate({
        path: "assignedTo",
        select: "firstName lastName email role department",
        populate: { path: "department", select: "name" },
      })
      .populate({
        path: "project",
        select: "name client departments budget",
        populate: { path: "client", select: "name" },
      })
      .populate({
        path: "departments",
        select: "name color",
      });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.status !== "completed") {
      task.status = "completed";
      await task.save();
      console.log(`Task ${task._id} marked as Completed`);
    } else {
      return res.status(400).json({ message: "Task is already completed." });
    }

    const mappedTask = mapTaskData(task);
    return res
      .status(200)
      .json({ message: "Task marked as completed", tasks: [mappedTask] });
  } catch (error) {
    console.error("Error marking task as completed:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Delete Task
 */
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found." });
    }
    return res.status(200).json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ message: "Server error while deleting task." });
  }
};

/**
 * Delete Many Tasks (Bulk)
 */
export const deleteManyTasks = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "A valid array of task IDs is required." });
    }

    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ message: `Invalid task IDs: ${invalidIds.join(", ")}` });
    }

    // Find tasks first
    const tasksToDelete = await Task.find({ _id: { $in: ids } });
    if (tasksToDelete.length === 0) {
      return res.status(404).json({ message: "No tasks found to delete." });
    }

    for (const task of tasksToDelete) {
      await task.deleteOne();
      console.log(`Task ${task._id} deleted`);
    }

    return res.status(200).json({
      message: `Successfully deleted ${tasksToDelete.length} task(s).`,
    });
  } catch (error) {
    console.error("Error deleting multiple tasks:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Send Daily Task Reminders
 * This function finds tasks due tomorrow (not completed) and sends reminders.
 * It sends emails asynchronously (fire-and-forget).
 */
export const sendDailyTaskReminders = async () => {
  try {
    const tomorrowStart = moment().add(1, "day").startOf("day").toDate();
    const tomorrowEnd = moment().add(1, "day").endOf("day").toDate();

    // Find tasks with dueDate tomorrow and not completed
    const tasksDueTomorrow = await Task.find({
      dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
      status: { $ne: "completed" },
    }).populate("assignedTo"); // get user docs

    if (!tasksDueTomorrow.length) {
      console.log("No tasks due tomorrow, no reminders sent.");
      return;
    }

    tasksDueTomorrow.forEach((task) => {
      const userEmails = task.assignedTo
        .filter((u) => u.email)
        .map((u) => u.email);
      if (!userEmails.length) return;

      // For simplicity, we say there are 24 hours remaining
      const hoursRemaining = 24;

      // Send reminder emails asynchronously (fire-and-forget)
      userEmails.forEach((email) => {
        sendReminderEmail(email, task.taskName, hoursRemaining)
          .then(() => {
            console.log(`Reminder email sent for task: ${task.taskName} to ${email}`);
          })
          .catch((err) => {
            console.error(`Failed to send reminder for task "${task.taskName}" to ${email}:`, err.message);
          });
      });
    });
  } catch (error) {
    console.error("Error in sendDailyTaskReminders:", error.message);
  }
};
