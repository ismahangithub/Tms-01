import { Router } from "express";
import {
  loginUser,
  registerUser,
} from "../controller/userController.mjs";
import {
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  verifyUserByEmail,
} from "../controller/adminController.mjs";
import {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate, // Import the new middleware
} from "../middleware/userValidation.mjs";
import { isAdmin } from "../middleware/isAdmin.mjs";

const router = Router();

// ===========================
// Public Routes
// ===========================

// User login
router.post("/loginUser", validateUserLogin, loginUser);

// User registration (Default Admin on first registration)
router.post("/registerUser", validateUserRegistration, registerUser);

// ===========================
// Admin-Protected Routes
// ===========================

// Create a new user with department assignment
router.post(
  "/createUser",
  isAdmin,
  validateUserRegistration,
  createUser
);

// Update an existing user (including department)
router.put(
  "/updateUser",
  isAdmin,
  validateUserUpdate, // Use the correct middleware here
  updateUser
);

// Verify a user by email
router.get("/verify/:email", isAdmin, verifyUserByEmail);

// Delete multiple users
router.delete("/delete", isAdmin, deleteUser);

// Fetch all users (no pagination)
router.get("/", isAdmin, async (req, res, next) => {
  try {
    await getAllUsers(req, res);
  } catch (error) {
    next(error); // Pass errors to the global error handler
  }
});
// In your server-side routes for users (example: users.js or similar)
router.post('/fetch', async (req, res) => {
  const { userIds } = req.body;
  try {
    const users = await User.find({ '_id': { $in: userIds } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Fetch all users for frontend `/users/fetchUsers` (no pagination, no `isAdmin` middleware)
// router.get("/users/fetchUsers", async (req, res, next) => {
//   try {
//     await getAllUsers(req, res);
//   } catch (error) {
//     next(error); // Pass errors to the global error handler
//   }
// });

export default router;
