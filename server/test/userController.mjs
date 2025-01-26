import User from "../models/user.mjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/config.mjs";
import { sendWelcomeEmail } from "../Utilits/emailService.mjs";

// ==============================
// API Health Check
// ==============================
export const getHome = (request, response) => {
  response.status(200).send("Welcome to the User Management System API!");
};

// ==============================
// Register User or Admin
// ==============================
export const registerUser = async (request, response) => {
  try {
    const { firstName, lastName, email, password, role } = request.body;

    if (!firstName || !lastName || !email || !password) {
      return response.status(400).json({ message: "All fields are required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return response.status(400).json({ message: "User already exists." });
    }

    // Assign first user as Admin, others as default "User"
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? "Admin" : role || "User";

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
    });
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.firstName);
      console.log(`Welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError.message);
    }

    user.password = undefined; // Exclude password from response
    response.status(201).json({ message: "User registered successfully.", user });
  } catch (error) {
    console.error("Error during registration:", error.message);
    response.status(500).json({ message: "An error occurred during registration." });
  }
};

// ==============================
// Login User
// ==============================
export const loginUser = async (request, response) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({ message: "Email and password are required." });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return response.status(401).json({ message: "Invalid email or password." });
    }

    // Check password
    const isMatched = await user.comparePasswords(password);
    if (!isMatched) {
      return response.status(401).json({ message: "Invalid email or password." });
    }

    // Generate JWT token
    const token = jwt.sign({ _id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set cookie
    response.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    user.password = undefined; // Exclude password from response
    response.status(200).json({ message: "Login successful.", user, token });
  } catch (error) {
    console.error("Error during login:", error.message);
    response.status(500).json({ message: "Login failed. Please try again." });
  }
};

// ==============================
// Update User
// ==============================
export const updateUser = async (request, response) => {
  try {
    const { userId, firstName, lastName, email, role, password } = request.body;

    const user = await User.findById(userId);
    if (!user) {
      return response.status(404).json({ message: "User not found." });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (password) user.password = password;

    await user.save();

    user.password = undefined;
    response.status(200).json({ message: "User updated successfully.", user });
  } catch (error) {
    console.error("Error updating user:", error.message);
    response.status(500).json({ message: "An error occurred while updating the user." });
  }
};

// ==============================
// Fetch All Users
// ==============================
export const getAllUsers = async (request, response) => {
  try {
    const users = await User.find({}, { password: 0 }).populate("department", "name");
    response.status(200).json({ message: "Users fetched successfully.", users });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    response.status(500).json({ message: "Error fetching users." });
  }
};
