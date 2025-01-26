import User from "../models/user.mjs";
import Department from "../models/Department.mjs"; // Ensure Department model is imported
import {
  sendWelcomeEmail,
  sendDepartmentChangeNotification,
} from "../Utilits/emailService.mjs";

// ==============================
// Create User
// ==============================
export const createUser = async (request, response) => {
  try {
    const { email, firstName, lastName, password, role, department } = request.body;

    if (!email || !password || !firstName || !lastName || !department) {
      return response.status(400).json({
        message: "All fields are required, including department.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return response.status(400).json({ message: "User already exists." });
    }

    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return response.status(400).json({ message: "Invalid department ID." });
    }

    const newUser = new User({
      email: email.toLowerCase(),
      firstName,
      lastName,
      password,
      role: role || "User",
      department,
    });

    await newUser.save();

    try {
      await sendWelcomeEmail(newUser.email, newUser.firstName, email, password);
      console.log(`Welcome email sent to ${newUser.email}`);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError.message);
    }

    response.status(201).json({
      message: "User created successfully.",
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        department: newUser.department,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error.message);
    response.status(500).json({
      message: "Error creating user.",
      error: error.message,
    });
  }
};

// ==============================
// Update User
// ==============================
export const updateUser = async (request, response) => {
  try {
    const {
      currentEmail,
      newEmail,
      firstName,
      lastName,
      role,
      password,
      department,
    } = request.body;

    if (!currentEmail) {
      return response
        .status(400)
        .json({ message: "Current email is required for updates." });
    }

    const user = await User.findOne({ email: currentEmail.toLowerCase() });
    if (!user) {
      return response.status(404).json({ message: "User not found." });
    }

    const previousDepartmentId = user.department ? user.department.toString() : null;

    if (newEmail && newEmail.toLowerCase() !== currentEmail.toLowerCase()) {
      const emailExists = await User.findOne({ email: newEmail.toLowerCase() });
      if (emailExists) {
        return response.status(400).json({ message: "Email already in use." });
      }
      user.email = newEmail.toLowerCase();
    }
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (password) user.password = password;
    if (department) user.department = department;

    const updatedUser = await user.save();

    try {
      if (password) {
        await sendWelcomeEmail(
          updatedUser.email,
          updatedUser.firstName,
          updatedUser.email,
          password
        );
        console.log(`Update notification email sent to ${updatedUser.email}`);
      }
    } catch (emailError) {
      console.error("Error sending update notification email:", emailError.message);
    }

    if (department && department !== previousDepartmentId) {
      const departmentDetails = await Department.findById(department);

      if (!departmentDetails) {
        console.error("Department not found for ID:", department);
      } else {
        const departmentUsers = await User.find({
          department: department,
          _id: { $ne: user._id },
        });

        const emails = departmentUsers.map((u) => u.email);

        try {
          if (emails.length > 0) {
            await sendDepartmentChangeNotification(
              emails,
              updatedUser.firstName,
              updatedUser.lastName,
              updatedUser.email,
              updatedUser.role,
              departmentDetails.name
            );
            console.log(
              `Department change notification emails sent to users in department ${departmentDetails.name}`
            );
          } else {
            console.log("No users in the department to notify.");
          }
        } catch (emailError) {
          console.error(
            "Error sending department change notification emails:",
            emailError.message
          );
        }
      }
    }

    response.status(200).json({
      message: "User updated successfully.",
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        department: updatedUser.department,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error.message);
    response.status(500).json({
      message: "Error updating user.",
      error: error.message,
    });
  }
};

// ==============================
// Verify User by Email
// ==============================
export const verifyUserByEmail = async (request, response) => {
  try {
    const { email } = request.params;

    if (!email) {
      return response.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate(
      "department",
      "name"
    );
    if (!user) {
      return response.status(404).json({ message: "User not found." });
    }

    response.status(200).json({
      message: "User verified successfully.",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
      },
    });
  } catch (error) {
    console.error("Error verifying user:", error.message);
    response.status(500).json({
      message: "Error verifying user.",
      error: error.message,
    });
  }
};

// ==============================
// Delete Users
// ==============================
export const deleteUser = async (request, response) => {
  try {
    const { userIds } = request.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return response
        .status(400)
        .json({ message: "Invalid request. User IDs are required." });
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });

    response.status(200).json({
      message: `${result.deletedCount} user(s) deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting users:", error.message);
    response.status(500).json({
      message: "Error deleting users.",
      error: error.message,
    });
  }
};

// ==============================
// Get All Users
// ==============================
// ==============================
// Get All Users with Pagination
// ==============================
export const getAllUsers = async (request, response) => {
  try {
    // Get page and limit from query parameters, defaulting to page 1 and 10 users per page
    const page = parseInt(request.query.page, 10) || 1;
    const limit = parseInt(request.query.limit, 10) || 10;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Fetch the users with pagination and populate the department name
    const users = await User.find({}, { password: 0 })
      .populate("department", "name")
      .skip(skip)
      .limit(limit);

    // Count the total number of users
    const totalUsers = await User.countDocuments();

    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / limit);

    response.status(200).json({
      message: "Users fetched successfully.",
      users,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    response.status(500).json({
      message: "Error fetching users.",
      error: error.message,
    });
  }
};
