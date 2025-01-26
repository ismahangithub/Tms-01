import Project from "../models/Project Model.mjs";
import Task from "../models/Task.mjs";
import User from "../models/user.mjs";

export const getDashboardData  = async (req, res) => {
  try {
    // Fetch project summary
    const projectSummary = await Project.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Fetch task summary
    const taskSummary = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Fetch user summary
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

    // Fetch budget summary
    const budgetSummary = await Project.aggregate([
      {
        $group: {
          _id: null,
          totalBudget: { $sum: "$projectBudget" },
          completedBudget: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$projectBudget", 0],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      projectSummary,
      taskSummary,
      userSummary,
      budgetSummary: budgetSummary[0] || { totalBudget: 0, completedBudget: 0 },
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error.message);
    res.status(500).json({ message: "Failed to fetch dashboard summary", error: error.message });
  }
};
