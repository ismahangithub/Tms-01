// server/controller/projectController.mjs
// server/controller/projectController.mjs

import mongoose from "mongoose";
import Project from "../models/Project Model.mjs";
import Task from "../models/Task.mjs";
import User from "../models/User.mjs";
import Client from "../models/Client.mjs";
import Department from "../models/Department.mjs";
import {
  sendWelcomeEmail,
  sendProjectCompletionEmail,
  sendProjectOverdueEmail,
  // We'll add a new function below in emailService for reminders
  sendProjectDueReminderEmail,
} from "../Utilits/emailService.mjs";

/**
 * Helper function to convert totalTasks & completedTasks into a "progress" string.
 */
const calculateProgressText = (totalTasks, completedTasks) => {
  if (totalTasks === 0) return "No tasks assigned";
  const open = totalTasks - completedTasks;
  return `${open} open task${open !== 1 ? "s" : ""}`;
};

/**
 * Create Project
 */
export const createProject = async (req, res) => {
  try {
    let {
      name,
      client,
      department,   // Single Department ID or an array of Department IDs
      members,      // Array of User IDs
      startDate,
      dueDate,
      projectBudget,
      priority = "medium",
    } = req.body;

    // Ensure that the user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: "User not authenticated." });
    }

    // Basic validations
    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json({ message: "Project name is required and must be a string." });
    }
    if (!client || !mongoose.Types.ObjectId.isValid(client)) {
      return res.status(400).json({ message: "A valid client ID is required." });
    }

    // Check if the department(s) are valid ObjectIds
    if (!Array.isArray(department)) {
      department = [department]; // If it's a single department, convert it to an array
    }
    for (const deptId of department) {
      if (!mongoose.Types.ObjectId.isValid(deptId)) {
        return res
          .status(400)
          .json({ message: `Invalid department ID: ${deptId}` });
      }
      // Ensure the department exists in the database
      const departmentExists = await Department.findById(deptId);
      if (!departmentExists) {
        return res.status(400).json({ message: `Department not found: ${deptId}` });
      }
    }

    // Validate members
    if (!Array.isArray(members)) {
      return res
        .status(400)
        .json({ message: "Members must be an array of user IDs." });
    }
    for (const memberId of members) {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return res
          .status(400)
          .json({ message: `Invalid member ID: ${memberId}` });
      }
    }

    // Validate dates
    if (!startDate || !dueDate) {
      return res
        .status(400)
        .json({ message: "Start date and due date are required." });
    }
    if (new Date(dueDate) <= new Date(startDate)) {
      return res
        .status(400)
        .json({ message: "Due date must be after the start date." });
    }

    // Determine initial status based on the current date vs. start/due
    const currentDate = new Date();
    let status = "pending";
    if (currentDate >= new Date(startDate) && currentDate <= new Date(dueDate)) {
      status = "in progress";
    } else if (currentDate > new Date(dueDate)) {
      status = "overdue";
    }

    // Create the new project document
    const project = new Project({
      name,
      client,
      department, // Use array of department IDs
      members,
      startDate,
      dueDate,
      projectBudget: projectBudget || 0,
      priority,
      status,
    });

    await project.save();

    // Respond to the client immediately after saving
    res.status(201).json({ message: "Project created successfully", project });

    // Perform background operations without blocking the response
    (async () => {
      try {
        // Send welcome emails to each newly added member
        const memberUsers = await User.find({ _id: { $in: members } });
        const emailPromises = memberUsers.map((member) =>
          sendWelcomeEmail(
            member.email,
            member.firstName,
            member.email,
            "InitialPassword123"
          ).catch((err) =>
            console.error(`Failed to send welcome email to ${member.email}:`, err)
          )
        );
        await Promise.all(emailPromises);
      } catch (err) {
        console.error("Error in background operations during project creation:", err);
      }
    })();
  } catch (error) {
    console.error("Error creating project:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      department,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const pageLimit = parseInt(limit, 10) || 10;

    // Build match filter from query
    const matchFilter = {};
    if (status) {
      matchFilter.status = {
        $in: Array.isArray(status)
          ? status.map((s) => s.toLowerCase())
          : [status.toLowerCase()],
      };
    }
    if (department) {
      matchFilter.department = { // Handle multiple departments
        $in: Array.isArray(department) ? department : [department],
      };
    }

    // ---------- Single Project fetch ----------
    if (id) {
      const singleProjectPipeline = [
        { $match: { _id: new mongoose.Types.ObjectId(id), ...matchFilter } },
        {
          $lookup: {
            from: "tasks",
            localField: "_id",
            foreignField: "project",
            as: "tasksData",
          },
        },
        {
          $addFields: {
            totalTasks: { $size: "$tasksData" },
            completedTasks: {
              $size: {
                $filter: {
                  input: "$tasksData",
                  as: "task",
                  cond: { $eq: ["$$task.status", "completed"] },
                },
              },
            },
            currentDate: new Date(),
          },
        },
        {
          $addFields: {
            statusComputed: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$dueDate", "$currentDate"] },
                    { $ne: ["$status", "completed"] },
                  ],
                },
                "overdue",
                "$status",
              ],
            },
          },
        },
        // Populate client
        {
          $lookup: {
            from: "clients",
            localField: "client",
            foreignField: "_id",
            as: "client",
          },
        },
        {
          $unwind: {
            path: "$client",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Populate department => multiple departments supported now
        {
          $lookup: {
            from: "departments",
            localField: "department", // Array of department IDs
            foreignField: "_id",
            as: "department", // Array of department objects
          },
        },
        // Populate members => array
        {
          $lookup: {
            from: "users",
            localField: "members",
            foreignField: "_id",
            as: "members",
          },
        },
        {
          $project: {
            name: 1,
            client: { _id: 1, name: 1, email: 1 },
            department: { _id: 1, name: 1 },
            members: { _id: 1, firstName: 1, lastName: 1, email: 1 },
            startDate: 1,
            dueDate: 1,
            status: "$statusComputed",
            projectBudget: 1,
            priority: 1,
            totalTasks: 1,
            completedTasks: 1,
          },
        },
      ];

      const singleResult = await Project.aggregate(singleProjectPipeline);
      if (!singleResult.length) {
        return res.status(404).json({ message: "Project not found." });
      }

      // Add "progress" field
      const projectDoc = singleResult[0];
      projectDoc.progress = calculateProgressText(
        projectDoc.totalTasks,
        projectDoc.completedTasks
      );

      return res.status(200).json(projectDoc);
    }

    // ---------- Multiple Projects with pagination ----------
    const pipeline = [
      { $match: matchFilter },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "project",
          as: "tasksData",
        },
      },
      {
        $addFields: {
          totalTasks: { $size: "$tasksData" },
          completedTasks: {
            $size: {
              $filter: {
                input: "$tasksData",
                as: "task",
                cond: { $eq: ["$$task.status", "completed"] },
              },
            },
          },
          currentDate: new Date(),
        },
      },
      {
        $addFields: {
          statusComputed: {
            $cond: [
              {
                $and: [
                  { $lt: ["$dueDate", "$currentDate"] },
                  { $ne: ["$status", "completed"] },
                ],
              },
              "overdue",
              "$status",
            ],
          },
        },
      },
      // Populate client
      {
        $lookup: {
          from: "clients",
          localField: "client",
          foreignField: "_id",
          as: "client",
        },
      },
      {
        $unwind: {
          path: "$client",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Populate department => multiple departments supported now
      {
        $lookup: {
          from: "departments",
          localField: "department", // Array of department IDs
          foreignField: "_id",
          as: "department", // Array of department objects
        },
      },
      // Populate members => array
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          as: "members",
        },
      },
      {
        $project: {
          name: 1,
          client: { _id: 1, name: 1, email: 1 },
          department: { _id: 1, name: 1 },
          members: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
          },
          startDate: 1,
          dueDate: 1,
          status: "$statusComputed",
          projectBudget: 1,
          priority: 1,
          totalTasks: 1,
          completedTasks: 1,
        },
      },
      { $skip: (pageNumber - 1) * pageLimit },
      { $limit: pageLimit },
    ];

    // For total count
    const totalCountPipeline = [
      { $match: matchFilter },
      { $count: "total" },
    ];

    // Run both aggregations in parallel
    const [projectsResult, totalCountResult] = await Promise.all([
      Project.aggregate(pipeline),
      Project.aggregate(totalCountPipeline),
    ]);

    const totalProjects =
      totalCountResult.length > 0 ? totalCountResult[0].total : 0;

    // Add "progress" field
    const updatedProjects = projectsResult.map((proj) => ({
      ...proj,
      progress: calculateProgressText(proj.totalTasks, proj.completedTasks),
    }));

    return res.status(200).json({
      projects: updatedProjects,
      pagination: {
        total: totalProjects,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalProjects / pageLimit),
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

/**
 * Update Project
 */
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      name,
      client,
      department,
      members,
      startDate,
      dueDate,
      projectBudget,
      priority,
      status,
      ...otherFields
    } = req.body;

    const project = await Project.findById(id).populate("members");
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const originalStatus = project.status;

    // Validate and update name
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ message: "Invalid project name." });
      }
      project.name = name.trim();
    }

    // Validate and update client
    if (client !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(client)) {
        return res.status(400).json({ message: "Invalid client ID." });
      }
      project.client = client;
    }

    // Validate and update departments
    if (department !== undefined) {
      // Ensure department is an array
      if (!Array.isArray(department)) {
        department = [department];
      }

      // Validate each department ID
      for (const deptId of department) {
        if (!mongoose.Types.ObjectId.isValid(deptId)) {
          return res.status(400).json({ message: `Invalid department ID: ${deptId}` });
        }
        // Ensure the department exists in the database
        const departmentExists = await Department.findById(deptId);
        if (!departmentExists) {
          return res.status(400).json({ message: `Department not found: ${deptId}` });
        }
      }

      project.department = department; // Assign the array of department IDs
    }

    // Validate and update members
    if (members !== undefined) {
      if (!Array.isArray(members)) {
        return res
          .status(400)
          .json({ message: "Members must be an array of user IDs." });
      }
      for (const memberId of members) {
        if (!mongoose.Types.ObjectId.isValid(memberId)) {
          return res
            .status(400)
            .json({ message: `Invalid member ID: ${memberId}` });
        }
      }
      project.members = members;
    }

    // Validate and update start date
    if (startDate !== undefined) {
      if (isNaN(Date.parse(startDate))) {
        return res.status(400).json({ message: "Invalid start date." });
      }
      project.startDate = new Date(startDate);
    }

    // Validate and update due date
    if (dueDate !== undefined) {
      if (isNaN(Date.parse(dueDate))) {
        return res.status(400).json({ message: "Invalid due date." });
      }
      project.dueDate = new Date(dueDate);
    }

    // Re-check if start/due dates have changed
    if (startDate !== undefined || dueDate !== undefined) {
      const effectiveStart = startDate
        ? new Date(startDate)
        : new Date(project.startDate);
      const effectiveDue = dueDate ? new Date(dueDate) : new Date(project.dueDate);

      if (effectiveDue <= effectiveStart) {
        return res
          .status(400)
          .json({ message: "Due date must be after the start date." });
      }

      // Update status based on dates
      const currentDate = new Date();
      if (project.status !== "completed") {
        if (currentDate < effectiveStart) {
          project.status = "pending";
        } else if (currentDate > effectiveDue) {
          project.status = "overdue";
        } else {
          project.status = "in progress";
        }
      }
    }

    // Validate and update project budget
    if (projectBudget !== undefined) {
      if (typeof projectBudget !== "number" || projectBudget < 0) {
        return res.status(400).json({ message: "Invalid project budget." });
      }
      project.projectBudget = projectBudget;
    }

    // Validate and update priority
    if (priority !== undefined) {
      const validPriorities = ["low", "medium", "high"];
      if (!validPriorities.includes(priority.toLowerCase())) {
        return res.status(400).json({ message: "Invalid priority value." });
      }
      project.priority = priority.toLowerCase();
    }

    // Validate and update status
    if (status !== undefined) {
      const validStatuses = ["pending", "in progress", "completed", "overdue"];
      if (!validStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      if (status.toLowerCase() === "completed") {
        // Ensure no open tasks
        const openTasks = await Task.find({
          project: id,
          status: { $ne: "completed" },
        });
        if (openTasks.length > 0) {
          return res.status(400).json({
            message:
              "Cannot mark project as completed. There are still open tasks.",
          });
        }
        project.status = "completed";
      } else {
        // Not completed => just set the status
        project.status = status.toLowerCase();
      }
    }

    // Apply any additional fields
    Object.assign(project, otherFields);

    await project.save();

    // Respond to the client after saving
    res.status(200).json({ message: "Project updated successfully.", project });

    // Perform background operations without blocking the response
    (async () => {
      try {
        // Example: If you have operations like sending notifications after project update
        if (status && status.toLowerCase() === "completed") {
          const updatedProject = await Project.findById(id).populate("members");
          const emailPromises = updatedProject.members.map((member) =>
            sendProjectCompletionEmail(member.email, updatedProject.name).catch((err) =>
              console.error(`Failed to send project completion email to ${member.email}:`, err)
            )
          );
          await Promise.all(emailPromises);
        }
      } catch (err) {
        console.error("Error in background operations during project update:", err);
      }
    })();
  } catch (error) {
    console.error("Error updating project:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

/**
 * Delete Many Projects (Bulk)
 */
export const deleteManyProjects = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ message: "A valid array of project IDs is required." });
    }

    // Validate each
    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res
        .status(400)
        .json({ message: `Invalid project IDs: ${invalidIds.join(", ")}` });
    }

    // Fetch for email notifications
    const projectsToDelete = await Project.find({ _id: { $in: ids } }).populate(
      "members"
    );
    if (!projectsToDelete.length) {
      return res.status(404).json({ message: "No projects found to delete." });
    }

    // Delete
    const deleteResult = await Project.deleteMany({ _id: { $in: ids } });

    // Respond to the client
    res.status(200).json({
      message: `Successfully deleted ${deleteResult.deletedCount} project(s).`,
    });

    // Perform background operations without blocking the response
    (async () => {
      try {
        // Send emails to members notifying project deletion
        const emailPromises = projectsToDelete.flatMap((proj) =>
          proj.members.map((member) =>
            sendProjectCompletionEmail(member.email, proj.name).catch((err) =>
              console.error(
                `Failed to send project deletion email to ${member.email}:`,
                err
              )
            )
          )
        );
        await Promise.all(emailPromises);
      } catch (err) {
        console.error("Error in background operations during project deletion:", err);
      }
    })();
  } catch (error) {
    console.error("Error deleting multiple projects:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

/**
 * Delete Single Project
 */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    const deletedProject = await Project.findByIdAndDelete(id).populate(
      "members"
    );
    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Respond to the client
    res.status(200).json({ message: "Project deleted successfully." });

    // Perform background operations without blocking the response
    (async () => {
      try {
        // Send emails to members notifying project deletion
        const emailPromises = deletedProject.members.map((member) =>
          sendProjectCompletionEmail(member.email, deletedProject.name).catch((err) =>
            console.error(
              `Failed to send project deletion email to ${member.email}:`,
              err
            )
          )
        );
        await Promise.all(emailPromises);
      } catch (err) {
        console.error("Error in background operations during single project deletion:", err);
      }
    })();
  } catch (error) {
    console.error("Error deleting single project:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
export const sendDailyProjectReminders = async () => {
  try {
    const tomorrowStart = moment().add(1, "day").startOf("day").toDate();
    const tomorrowEnd = moment().add(1, "day").endOf("day").toDate();

    // Find all projects with a dueDate within tomorrow
    const projectsDueTomorrow = await Project.find({
      dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
      status: { $ne: "completed" }, // only if not completed
    }).populate("members"); // so we can email them

    if (!projectsDueTomorrow.length) {
      console.log("No projects are due tomorrow, no reminders sent.");
      return;
    }

    for (const proj of projectsDueTomorrow) {
      // We assume "members" is an array of user objects
      const emails = proj.members
        .filter((m) => m.email)
        .map((m) => m.email);

      if (!emails.length) {
        continue;
      }

      // Call a new email function from your email service
      await sendProjectDueReminderEmail(
        emails,
        proj.name,
        proj.dueDate
      );
      console.log(`Project due reminder sent for project: ${proj.name}`);
    }
  } catch (error) {
    console.error("Error in sendDailyProjectReminders:", error.message);
  }
};