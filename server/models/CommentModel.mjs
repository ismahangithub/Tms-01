// server/models/CommentModel.mjs

import mongoose from "mongoose";
import { sendCommentEmail } from "../Utilits/emailService.mjs"; // Adjust the path as necessary

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // A comment must be associated with either a project or a task
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: false,
    },
    // Optional: For threaded replies
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      required: false,
    },
    // Optional: For file attachments
    attachments: [
      {
        type: String, // URL to the uploaded file
      },
    ],
  },
  { timestamps: true }
);

// Pre-validation hook to ensure association with either project or task
commentSchema.pre("validate", function (next) {
  if (!this.project && !this.task) {
    this.invalidate("project", "A comment must be associated with either a project or a task.");
    this.invalidate("task", "A comment must be associated with either a project or a task.");
  }
  next();
});

// Post-save hook to send email notifications
commentSchema.post("save", async function (doc, next) {
  try {
    let recipients = [];

    // If the comment is associated with a project, notify project members
    if (doc.project) {
      const Project = mongoose.model("Project");
      const project = await Project.findById(doc.project).populate("members");
      if (project) {
        recipients = project.members.map((member) => member.email);
      }
    }

    // If the comment is associated with a task, notify task assignees
    if (doc.task) {
      const Task = mongoose.model("Task");
      const task = await Task.findById(doc.task).populate("assignedTo");
      if (task) {
        recipients = recipients.concat(task.assignedTo.map((user) => user.email));
      }
    }

    // Remove duplicate emails
    recipients = [...new Set(recipients)];

    // Exclude the author from recipients to prevent self-notifications
    const User = mongoose.model("User");
    const author = await User.findById(doc.author);
    if (author) {
      recipients = recipients.filter((email) => email !== author.email);
    }

    // OPTIONAL: Add Admins to recipients
    const admins = await User.find({ role: "Admin" }).select("email");
    recipients = recipients.concat(admins.map((admin) => admin.email));

    // Remove duplicates again after adding Admins
    recipients = [...new Set(recipients)];

    // Send the email if there are recipients
    if (recipients.length > 0) {
      await sendCommentEmail(recipients, doc.content, author);
      console.log(`Email sent to: ${recipients.join(", ")}`);
    }

    // Emit real-time update if using Socket.io (optional)
    // const io = req.app.get('io'); // Assuming you've set up Socket.io on the app instance
    // io.to(`project_${doc.project}`).emit('newComment', doc);
    // io.to(`task_${doc.task}`).emit('newComment', doc);

    next();
  } catch (error) {
    console.error("Error sending comment email notification:", error);
    next(error);
  }
});

// Virtual field to populate replies (for threaded comments)
commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentComment",
});

// Ensure virtual fields are serialized
commentSchema.set("toObject", { virtuals: true });
commentSchema.set("toJSON", { virtuals: true });

// Avoid OverwriteModelError
const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);

export default Comment;
