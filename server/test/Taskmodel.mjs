import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    taskName: {
      type: String,
      required: true,
      trim: true,
      set: (value) =>
        value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
    },
    description: {
      type: String,
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
      required: true,
      validate: {
        validator: async function (value) {
          if (!this.project) return true; // Skip validation if `project` is missing
          const project = await mongoose.model("Project").findById(this.project);
          if (!project) return true; // Skip validation if the associated project is missing
          return value <= project.dueDate; // Validate dueDate
        },
        message: "Task due date cannot exceed the project's due date.",
      },
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"], // Ensure the enum matches frontend
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;
