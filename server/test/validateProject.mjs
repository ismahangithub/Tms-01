import mongoose from "mongoose";

export const validateProjectPayload = (req, res, next) => {
  const { name, client, department, members, startDate, dueDate } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Project name is required and must be a string." });
  }

  if (!client || !mongoose.Types.ObjectId.isValid(client)) {
    return res.status(400).json({ message: "Valid client ID is required." });
  }

  if (!department || !mongoose.Types.ObjectId.isValid(department)) {
    return res.status(400).json({ message: "Valid department ID is required." });
  }

  if (!Array.isArray(members) || members.some((m) => !mongoose.Types.ObjectId.isValid(m))) {
    return res.status(400).json({ message: "Valid member IDs are required." });
  }

  if (!startDate || !Date.parse(startDate)) {
    return res.status(400).json({ message: "Valid start date is required." });
  }

  if (!dueDate || !Date.parse(dueDate)) {
    return res.status(400).json({ message: "Valid due date is required." });
  }

  if (new Date(dueDate) <= new Date(startDate)) {
    return res.status(400).json({ message: "Due date must be after start date." });
  }

  next();
};
