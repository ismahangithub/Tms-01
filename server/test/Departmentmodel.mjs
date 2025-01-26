// src/models/Department.mjs

import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: "#000000", // Default to black
    },
  },
  { timestamps: true }
);

DepartmentSchema.pre("save", function (next) {
  this.name = this.name.toLowerCase(); // Ensure case-insensitive uniqueness
  next();
});

// Virtual field to populate users in the department
DepartmentSchema.virtual("users", {
  ref: "User",
  localField: "_id",
  foreignField: "department",
});

// Ensure virtual fields are serialized
DepartmentSchema.set("toObject", { virtuals: true });
DepartmentSchema.set("toJSON", { virtuals: true });

const Department = mongoose.model("Department", DepartmentSchema);
export default Department;
