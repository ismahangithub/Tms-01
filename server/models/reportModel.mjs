import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    scope: {
      type: String,
      enum: ["project", "client", "department", "task", "user"], // Scope of the report
      required: true,
      validate: {
        validator: function (value) {
          if (value === "project" && !this.project) return false;
          if (value === "client" && !this.client) return false;
          if (value === "department" && !this.department) return false;
          if (value === "task" && !this.task) return false;
          if (value === "user" && !this.user) return false;
          return true;
        },
        message: "The field corresponding to the scope must be provided.",
      },
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",  // Links to Project
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",  // Links to Client
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",  // Links to Department
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",  // Links to Task
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",  // Links to User (for user-specific reports)
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",  // Links to User who created the report
      required: true,
    },
    emailRecipients: [
      {
        type: String,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Invalid email address",
        ],
      },
    ],
    status: {
      type: String,
      enum: ["draft", "submitted", "reviewed", "approved"], // More statuses
      default: "draft",
    },
    sentAt: {
      type: Date,
    },
    reviewedAt: {
      type: Date,  // Timestamp for when the report is reviewed
    },
    approvedAt: {
      type: Date,  // Timestamp for when the report is approved
    },
  },
  { timestamps: true }
);

// Pre-save hook to log the report creation or update
reportSchema.pre("save", function (next) {
  if (this.isNew) {
    console.log(`New report created: ${this.title}`);
  } else {
    console.log(`Report updated: ${this.title}`);
  }
  next();
});

// Virtuals to populate the full details of project, client, department, task, and user
reportSchema.virtual("projectDetails", {
  ref: "Project",
  localField: "project",
  foreignField: "_id",
  justOne: true,
});

reportSchema.virtual("clientDetails", {
  ref: "Client",
  localField: "client",
  foreignField: "_id",
  justOne: true,
});

reportSchema.virtual("departmentDetails", {
  ref: "Department",
  localField: "department",
  foreignField: "_id",
  justOne: true,
});

reportSchema.virtual("taskDetails", {
  ref: "Task",
  localField: "task",
  foreignField: "_id",
  justOne: true,
});

reportSchema.virtual("userDetails", {
  ref: "User",
  localField: "user",
  foreignField: "_id",
  justOne: true,
});

reportSchema.virtual("creator", {
  ref: "User",
  localField: "createdBy",
  foreignField: "_id",
  justOne: true,
});

// Virtual field to populate comments related to the report (if needed)
reportSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "report", // If you decide to associate comments with reports
});

// Ensure virtual fields are serialized when converting to JSON or Object
reportSchema.set("toObject", { virtuals: true });
reportSchema.set("toJSON", { virtuals: true });

// Avoid OverwriteModelError for Report model
const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);

export default Report;
