// src/models/Meeting.mjs

import mongoose from "mongoose";

const MeetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true,
      },
    ],
    invitedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    agenda: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field to reference the department names
MeetingSchema.virtual("departmentDetails", {
  ref: "Department",
  localField: "departments",
  foreignField: "_id",
});

// Virtual field to reference the invited user details
MeetingSchema.virtual("invitedUserDetails", {
  ref: "User",
  localField: "invitedUsers",
  foreignField: "_id",
});

// Ensure virtual fields are serialized
MeetingSchema.set("toObject", { virtuals: true });
MeetingSchema.set("toJSON", { virtuals: true });

const Meeting = mongoose.model("Meeting", MeetingSchema);
export default Meeting;
