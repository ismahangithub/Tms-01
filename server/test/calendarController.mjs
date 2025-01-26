import axios from 'axios';  // Import axios
import Project from "../models/Project Model.mjs";
import Task from "../models/Task.mjs";

// Get project timelines
export const getProjectTimelines = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    // Build query filters
    const filters = {};
    if (startDate) filters.startDate = { $gte: new Date(startDate) };
    if (endDate) filters.dueDate = { $lte: new Date(endDate) };
    if (department) filters.department = department;

    // Fetch projects
    const projects = await Project.find(filters, "name startDate dueDate department")
      .populate("department", "name")
      .sort({ startDate: 1 });

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error fetching project timelines:", error.message);
    res.status(500).json({ message: "Failed to fetch project timelines." });
  }
};

// Get task timelines
export const getTaskTimelines = async (req, res) => {
  try {
    const { startDate, endDate, projectName } = req.query;

    // Fetch tasks with optional filters
    const filters = {};
    if (startDate) filters.dueDate = { $gte: new Date(startDate) };
    if (endDate) filters.dueDate = { $lte: new Date(endDate) };
    if (projectName) {
      const project = await Project.findOne({ name: projectName }, "_id");
      if (project) filters.project = project._id;
    }

    const tasks = await Task.find(filters, "taskName dueDate priority status project assignedTo")
      .populate("project", "name")
      .populate("assignedTo", "firstName lastName")
      .sort({ dueDate: 1 });

    res.status(200).json({ tasks });
  } catch (error) {
    console.error("Error fetching task timelines:", error.message);
    res.status(500).json({ message: "Failed to fetch task timelines." });
  }
};

// Get global holidays
export const getGlobalHolidays = async (req, res) => {
  try {
    // Fetch holidays from the external API (with CORS proxy if needed)
    const response = await axios.get('https://date.nager.at/Api/v2/NextPublicHolidaysWorldwide');
    const holidays = response.data;

    // Send the holidays data to the frontend
    res.status(200).json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ error: 'Failed to fetch holiday data' });
  }
};
