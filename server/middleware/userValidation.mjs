import { check, validationResult } from "express-validator";

// Common error handler
const handleValidationErrors = (request, response, next) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    const uniqueErrors = {};
    errors.array().forEach((err) => {
      if (!uniqueErrors[err.param]) {
        uniqueErrors[err.param] = err.msg;
      }
    });
    return response.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: uniqueErrors,
    });
  }
  next();
};

// Reusable validation rules
const emailValidation = check("email")
  .trim()
  .notEmpty()
  .withMessage("Email is required")
  .isEmail()
  .withMessage("Please enter a valid email");

const passwordValidation = check("password")
  .trim()
  .notEmpty()
  .withMessage("Password is required")
  .isStrongPassword({
    minLength: 8,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  .withMessage(
    "Password must be strong (at least 8 characters, 1 uppercase, 1 number, 1 symbol)"
  );

// Validation rules for user registration
export const validateUserRegistration = [
  check("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters long"),

  check("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2 })
    .withMessage("Last name must be at least 2 characters long"),

  emailValidation,

  passwordValidation,

  check("role")
    .optional()
    .isIn(["Admin", "User"])
    .withMessage("Invalid role. Allowed values are 'Admin' or 'User'."),

  handleValidationErrors,
];

// Validation rules for user login
export const validateUserLogin = [
  emailValidation,

  check("password").trim().notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

// Validation rules for user update
export const validateUserUpdate = [
  check("currentEmail")
    .trim()
    .notEmpty()
    .withMessage("Current email is required for updates")
    .isEmail()
    .withMessage("Please enter a valid email"),

  check("newEmail")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please enter a valid new email"),

  check("firstName")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters long"),

  check("lastName")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Last name must be at least 2 characters long"),

  check("password")
    .optional()
    .trim()
    .isStrongPassword({
      minLength: 8,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be strong (at least 8 characters, 1 uppercase, 1 number, 1 symbol)"
    ),

  check("role")
    .optional()
    .isIn(["Admin", "User"])
    .withMessage("Invalid role. Allowed values are 'Admin' or 'User'."),

  handleValidationErrors,
];
