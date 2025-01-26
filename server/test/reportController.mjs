import Project from "../models/Project Model.mjs";
import Task from "../models/Task.mjs";
import User from "../models/user.mjs";
import Client from "../models/client.mjs";

// Fetch reports
export const getReport = async (req, res) => {
  try {
    const { client, project, user, startDate, endDate } = req.query;

    // Filters
    const projectFilter = {};
    const taskFilter = {};
    if (client) projectFilter.client = client;
    if (project) taskFilter.projectId = project;
    if (user) taskFilter.assignedTo = user;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      projectFilter.startDate = { $gte: start, $lte: end };
      taskFilter.dueDate = { $gte: start, $lte: end };
    }

    // Client Performance
    const clientPerformance = await Client.aggregate([
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
          totalBudget: { $sum: "$projects.projectBudget" },
          totalProjects: { $size: "$projects" },
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          totalProjects: 1,
          totalBudget: 1,
        },
      },
    ]);

    // Project Performance
    const projectPerformance = await Project.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Task Performance
    const taskPerformance = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // User Performance
    const userPerformance = await User.aggregate([
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
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          completedTasks: 1,
        },
      },
    ]);

    res.status(200).json({
      clientPerformance,
      projectPerformance,
      taskPerformance,
      userPerformance,
    });
  } catch (error) {
    console.error("Error generating report:", error.message);
    res.status(500).json({ message: "Failed to generate report", error: error.message });
  }
};
