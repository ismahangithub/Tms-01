import TaskDetails from "../models/TaskDetails.js";

export const getTaskDetails = async (req, res) => {
  const { taskId } = req.params;

  try {
    const taskDetails = await TaskDetails.findOne({ task: taskId })
      .populate("comments.createdBy", "name")
      .populate("attachments.uploadedBy", "name");

    if (!taskDetails) {
      return res.status(404).json({ message: "Task details not found." });
    }

    res.json(taskDetails);
  } catch (error) {
    console.error("Error fetching task details:", error);
    res.status(500).json({ error: "Failed to fetch task details" });
  }
};
