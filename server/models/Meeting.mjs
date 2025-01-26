import mongoose from "mongoose";

const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Meeting title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    agenda: {
      type: String,
      required: [true, "Meeting agenda is required"],
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
      validate: {
        validator: function (value) {
          return value > this.startTime; // Ensures `endTime` is after `startTime`
        },
        message: "End time must be after the start time.",
      },
    },
    date: {
      type: Date,
      required: [true, "Meeting date is required"],
      validate: {
        validator: function (value) {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Ignore time component
          return value >= today; // Ensure the meeting date is today or in the future
        },
        message: "Meeting date cannot be in the past.",
      },
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false, // Optional field
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],
    invitedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Canceled"],
      default: "Scheduled",
    },
    color: {
      type: String,
      default: "#FF0000", // Default color (red)
      validate: {
        validator: (value) => colorRegex.test(value),
        message: "Invalid color code. It should be a valid HEX code.",
      },
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt`
  }
);

// Virtual field to populate comments related to the meeting
meetingSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "meeting", // If you decide to associate comments with meetings
});

// Ensure virtual fields are serialized
meetingSchema.set("toObject", { virtuals: true });
meetingSchema.set("toJSON", { virtuals: true });

// Avoid OverwriteModelError
const Meeting =
  mongoose.models.Meeting || mongoose.model("Meeting", meetingSchema);

export default Meeting;
