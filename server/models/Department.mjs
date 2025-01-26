import mongoose from "mongoose";

const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, // store in lowercase for consistency
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: "#000000",
      validate: {
        validator: (value) => colorRegex.test(value),
        message: "Invalid color code. It should be a valid HEX code.",
      },
    },
  },
  { timestamps: true }
);

// Virtual field to populate users in the department
DepartmentSchema.virtual("users", {
  ref: "User",
  localField: "_id",
  foreignField: "department",
});

// Ensure virtual fields are serialized
DepartmentSchema.set("toObject", { virtuals: true });
DepartmentSchema.set("toJSON", { virtuals: true });

// Avoid OverwriteModelError
const Department =
  mongoose.models.Department || mongoose.model("Department", DepartmentSchema);

export default Department;
