import mongoose from "mongoose";

const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
      validate: {
        validator: function (value) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return value >= today; // future or same day
        },
        message: "Event date cannot be in the past.",
      },
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
          return value > this.startTime;
        },
        message: "End time must be after the start time.",
      },
    },
    color: {
      type: String,
      default: "#FF5733",
      validate: {
        validator: (value) => colorRegex.test(value),
        message: "Invalid color code.",
      },
    },
    type: {
      type: String,
      enum: ["Meeting", "Holiday", "Event", "Other"],
      default: "Event",
    },
  },
  { timestamps: true }
);

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);
export default Event;
