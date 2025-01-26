import mongoose from "mongoose";

// Define the Project Schema
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    // Update the field to "department" (plural is already handled as an array)
    department: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true,
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    startDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value <= this.dueDate;
        },
        message: "Start date must be before or equal to due date.",
      },
    },
    dueDate: {
      type: Date,
      required: true,
    },
    projectBudget: {
      type: Number,
      default: 0,
      min: [0, "Project budget cannot be negative"],
    },
    status: {
      type: String,
      enum: ["pending", "in progress", "completed", "overdue"],
      default: "pending",
    },
    progress: {
      type: String,
      default: "No tasks assigned",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    // Removed the activities field to disable activity logging
    // activities: [activitySchema],
  },
  { timestamps: true }
);

// Virtual field to populate comments related to the project
projectSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "project",
});

// Pre-save hook to calculate progress and update status based on dates
projectSchema.pre("save", async function (next) {
  try {
    const Task = mongoose.model("Task");
    const tasks = await Task.find({ _id: { $in: this.tasks } });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status.toLowerCase() === "completed"
    ).length;

    // Update progress
    if (totalTasks === 0) {
      this.progress = "No tasks assigned";
    } else {
      const openTasks = totalTasks - completedTasks;
      this.progress = `${openTasks} open task${openTasks > 1 ? "s" : ""}`;
    }

    // Update status based on the current date vs. start/due dates
    const currentDate = new Date();
    if (this.status !== "completed") {
      if (currentDate < this.startDate) {
        this.status = "pending";
      } else if (currentDate >= this.startDate && currentDate <= this.dueDate) {
        this.status = "in progress";
      } else if (currentDate > this.dueDate) {
        this.status = "overdue";
      }
    }

    next();
  } catch (error) {
    console.error("Error in project pre-save hook:", error);
    next(error);
  }
});

// Ensure virtual fields are serialized
projectSchema.set("toObject", { virtuals: true });
projectSchema.set("toJSON", { virtuals: true });

// Avoid OverwriteModelError
const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);

export default Project;
