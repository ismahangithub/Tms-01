import mongoose from "mongoose";

const capitalizeWords = (value) =>
  value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const phoneRegex = /^\+?\d{10,15}$/;

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Ensures client names are unique
      trim: true,
      set: capitalizeWords,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"], // Validates email format
    },
    address: {
      type: String,
      required: true,
      trim: true,
      set: capitalizeWords,
    },
    phoneNumberOne: {
      type: String, // Use String for international numbers
      required: true,
      trim: true,
      validate: {
        validator: (value) => phoneRegex.test(value),
        message: "Invalid phone number. It should be 10-15 digits, optionally starting with '+'.",
      },
    },
    phoneNumberTwo: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => !value || phoneRegex.test(value), // Allow empty string
        message: "Invalid phone number. It should be 10-15 digits, optionally starting with '+'.",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure that we don't re-register the model
const Client = mongoose.models.Client || mongoose.model("Client", clientSchema);

export default Client;
