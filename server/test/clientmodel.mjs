import mongoose from "mongoose";

const clientSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Ensures client names are unique
      trim: true,
      set: (value) =>
        value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
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
      set: (value) =>
        value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
    },
    phoneNumberOne: {
      type: String, // Use String for international numbers
      required: true,
      trim: true,
      validate: {
        validator: (value) => /^\d{10,15}$/.test(value), // Validates phone numbers (10-15 digits)
        message: "Invalid phone number",
      },
    },
    phoneNumberTwo: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => /^\d{10,15}$/.test(value), // Optional second phone number
        message: "Invalid phone number",
      },
    },
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model("Client", clientSchema);

export default Client;
