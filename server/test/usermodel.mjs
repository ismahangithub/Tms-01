// src/models/User.mjs

import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      set: (value) =>
        value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
      match: [/^[A-Za-z]+$/, "First name must contain only alphabets"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      set: (value) =>
        value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
      match: [/^[A-Za-z]+$/, "Last name must contain only alphabets"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },
    role: {
      type: String,
      enum: ["Admin", "User"],
      default: "User",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Pre-save hook to hash passwords
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error(`Error while hashing the password: ${error.message}`);
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePasswords = async function (givenPassword) {
  try {
    return await bcrypt.compare(givenPassword, this.password);
  } catch (error) {
    console.error(`Error while comparing passwords: ${error.message}`);
    throw new Error("Password comparison failed");
  }
};

// Virtual field for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual field to populate meetings the user is invited to
userSchema.virtual("meetings", {
  ref: "Meeting",
  localField: "_id",
  foreignField: "invitedUsers",
});

// Ensure virtual fields are serialized
userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

const User = mongoose.model("User", userSchema);

export default User;
