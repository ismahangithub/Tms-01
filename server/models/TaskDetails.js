import mongoose from "mongoose";

const TaskDetailsSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true }, // Reference to the Task
  comments: [
    {
      text: { type: String, required: true },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User
      createdAt: { type: Date, default: Date.now },
    },
  ],
  attachments: [
    {
      fileName: { type: String, required: true },
      fileUrl: { type: String, required: true },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
});

const TaskDetails = mongoose.model("TaskDetails", TaskDetailsSchema);
export default TaskDetails;
