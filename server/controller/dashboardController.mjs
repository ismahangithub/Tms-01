// server/controllers/dashboardController.mjs

import mongoose from "mongoose";
import Project from "../models/Project Model.mjs"; // Corrected import path
import Task from "../models/Task.mjs";
import User from "../models/User.mjs";
import Client from "../models/Client.mjs";
import Report from "../models/ReportModel.mjs"; // Assuming you have a Report model

/**
 * Get Dashboard Data with Advanced Filtering and Aggregations
 * Supports:
 * - Task Status and Date Filtering
 * - Clients based on Project Status
 * - User-specific Task Statistics
 * - Budget Overview
 */
export const getDashboardData = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const {
      taskStatus,        // e.g., 'completed', 'pending', 'in progress', 'overdue', 'all'
      taskStartDate,     // ISO date string
      taskEndDate,       // ISO date string
      userId,            // Specific user ID for user graphs
    } = req.query;

    // **Project Filters**
    const projectFilter = {}; // Additional filters can be added here if needed

    // **Task Filters**
    const taskFilter = {};
    if (taskStatus && taskStatus.toLowerCase() !== "all") {
      taskFilter.status = taskStatus.toLowerCase();
    }
    if (taskStartDate || taskEndDate) {
      taskFilter.dueDate = {};
      if (taskStartDate) {
        taskFilter.dueDate.$gte = new Date(taskStartDate);
      }
      if (taskEndDate) {
        taskFilter.dueDate.$lte = new Date(taskEndDate);
      }
    }

    // **User Filter for User Graphs**
    const userFilter = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      userFilter._id = mongoose.Types.ObjectId(userId);
    }

    // **Counts**
    const clientsCount = await Client.countDocuments();
    const projectsCount = await Project.countDocuments(projectFilter);
    const tasksCount = await Task.countDocuments(taskFilter);
    const reportsCount = await Report.countDocuments(projectFilter); // Assuming reports are linked to projects

    // **Project Summary: Count of Projects by Status**
    const projectSummary = await Project.aggregate([
      { $match: projectFilter },
      {
        $group: {
          _id: { $toLower: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);

    // **Task Summary: Count of Tasks by Status**
    const taskSummary = await Task.aggregate([
      { $match: taskFilter },
      {
        $group: {
          _id: { $toLower: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);

    // **User Summary: Tasks Completed by Each User**
    const userSummary = await User.aggregate([
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "assignedTo",
          as: "tasks",
        },
      },
      {
        $addFields: {
          completedTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: { $eq: ["$$task.status", "completed"] },
              },
            },
          },
          pendingTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: { $eq: ["$$task.status", "pending"] },
              },
            },
          },
          overdueTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: { $eq: ["$$task.status", "overdue"] },
              },
            },
          },
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          completedTasks: 1,
          pendingTasks: 1,
          overdueTasks: 1,
        },
      },
    ]);

    // **Client Counts Based on Project Status**
    const clientStatusCounts = await Client.aggregate([
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "client",
          as: "projects",
        },
      },
      {
        $addFields: {
          ongoingProjects: {
            $size: {
              $filter: {
                input: "$projects",
                as: "project",
                cond: { $eq: ["$$project.status", "in progress"] },
              },
            },
          },
          verifiedProjects: {
            $size: {
              $filter: {
                input: "$projects",
                as: "project",
                cond: { $eq: ["$$project.status", "verified"] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          notInProject: {
            $cond: [
              { $eq: ["$projects", []] },
              1,
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          ongoingClients: { $sum: "$ongoingProjects" },
          verifiedClients: { $sum: "$verifiedProjects" },
          notInProjectClients: { $sum: "$notInProject" },
        },
      },
    ]);

    const { ongoingClients, verifiedClients, notInProjectClients } = clientStatusCounts[0] || {
      ongoingClients: 0,
      verifiedClients: 0,
      notInProjectClients: 0,
    };

    // **User Task Statistics with Optional User Filter**
    let filteredUserSummary = userSummary;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filteredUserSummary = userSummary.filter(
        (user) => user._id.toString() === userId
      );
    }

    // **Budget Summary: Total Budget vs. Completed Budget**
    const budgetSummary = await Project.aggregate([
      {
        $match: projectFilter,
      },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: "$projectBudget" }, // Assuming 'projectBudget' field exists
          completedBudget: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$projectBudget", 0],
            },
          },
        },
      },
    ]);

    const { totalBudget, completedBudget } = budgetSummary[0] || {
      totalBudget: 0,
      completedBudget: 0,
    };

    // **Fetching Recent Tasks**
    const recentTasks = await Task.find(taskFilter)
      .populate([
        { path: "assignedTo", select: "firstName lastName email" },
        { path: "project", select: "name client departments budget" },
      ])
      .sort({ createdAt: -1 }) // Sort by most recent
      .limit(10) // Adjust the number as needed
      .exec();

    res.status(200).json({
      clientsCount,
      projectsCount,
      tasksCount,
      reportsCount,
      projectSummary,
      taskSummary,
      userSummary: filteredUserSummary,
      ongoingClients,
      verifiedClients,
      notInProjectClients,
      budgetSummary: {
        totalBudget,
        completedBudget,
        remainingBudget: totalBudget - completedBudget,
      },
      recentTasks,
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error.message);
    res
      .status(500)
      .json({ message: "Failed to fetch dashboard summary", error: error.message });
  }
};
