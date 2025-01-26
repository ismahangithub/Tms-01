import mongoose from "mongoose";

// Activity Schema (Embedded Document)
const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, "Action is required"],
      enum: [
        "Task Created",
        "Task Updated",
        "Status Changed",
        "Task Completed",
        "Task Deleted",
        "Task Started",
        "Task Pending",
      ],
    },
    performedBy: {
      type: String,
      required: [true, "Performed By is required"],
    },
    details: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false } // Prevent separate _id for each activity
);

// Define the Task Schema
const taskSchema = new mongoose.Schema(
  {
    taskName: {
      type: String,
      required: [true, "Task name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Associated project is required"],
    },
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: [true, "At least one department must be assigned"],
      },
    ],
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
      required: [true, "Due date is required"],
    },
    status: {
      type: String,
      enum: ["pending", "in progress", "completed", "overdue"],
      default: "pending",
    },
    /**
     * startDate: If the task is "pending" or "in progress",
     * we set a date automatically only when there's no existing startDate.
     */
    startDate: {
      type: Date,
      default: null, // Will only be auto-set if null and status is pending/in progress
    },
    // Embedded Activities Array
    activities: [activitySchema],
  },
  { timestamps: true }
);

// Virtual field to populate comments related to the task
taskSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "task",
});

/**
 * Pre-save hook to handle automatic status and startDate
 * Implementing Option A: only set startDate if it's *currently* null (not user-set).
 */
taskSchema.pre("save", function (next) {
  const currentDate = new Date();

  // 1) If status is "in progress" or "pending" and startDate is *not yet set*:
  //    => only set it if it's truly null (meaning the user hasn't set it).
  if (
    (this.status === "in progress" || this.status === "pending") &&
    this.startDate == null // i.e. no user-set date
  ) {
    this.startDate = currentDate;
    this.activities.push({
      action: this.status === "in progress" ? "Task Started" : "Task Pending",
      performedBy: "System",
      details: `Task has been set to ${this.status}.`,
    });
  }

  // 2) If current date > dueDate and status not completed or overdue => set overdue
  if (
    currentDate > this.dueDate &&
    this.status !== "completed" &&
    this.status !== "overdue"
  ) {
    this.status = "overdue";
    this.activities.push({
      action: "Status Changed",
      performedBy: "System",
      details: "Task status automatically set to overdue.",
    });
  }

  // 3) Validate that startDate <= dueDate
  if (this.startDate && this.startDate > this.dueDate) {
    return next(new Error("startDate cannot be after dueDate for this task."));
  }

  next();
});

// Post-save hook to associate the saved Task with its Project
taskSchema.post("save", async function (doc, next) {
  try {
    const Project = mongoose.model("Project");
    const project = await Project.findById(doc.project);
    if (project) {
      if (!project.tasks.includes(doc._id)) {
        project.tasks.push(doc._id);
        await project.save();
        console.log(`Task ${doc._id} associated with Project ${project._id}`);
      } else {
        console.log(
          `Task ${doc._id} already associated with Project ${project._id}`
        );
      }
    } else {
      console.warn(`Project ${doc.project} not found for Task ${doc._id}`);
    }
    next();
  } catch (error) {
    console.error("Error in task post-save hook:", error);
    next(error);
  }
});

// Post-remove hook to disassociate the removed Task from its Project
taskSchema.post("remove", async function (doc, next) {
  try {
    const Project = mongoose.model("Project");
    const project = await Project.findById(doc.project);
    if (project) {
      project.tasks = project.tasks.filter(
        (taskId) => taskId.toString() !== doc._id.toString()
      );
      await project.save();
      console.log(`Task ${doc._id} removed from Project ${project._id}`);
    }
    next();
  } catch (error) {
    console.error("Error in task post-remove hook:", error);
    next(error);
  }
});

// Ensure virtual fields are serialized
taskSchema.set("toObject", { virtuals: true });
taskSchema.set("toJSON", { virtuals: true });

// Avoid OverwriteModelError
const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
export default Task;
