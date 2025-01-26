import { check, validationResult } from "express-validator";

// Common error handler for validation
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

// Validation rules for task creation and updates
export const validateTask = [
  check("title")
    .trim()
    .notEmpty()
    .withMessage("Task title is required")
    .isLength({ min: 3 })
    .withMessage("Task title must be at least 3 characters long"),

  check("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  check("dueDate")
    .notEmpty()
    .withMessage("Due date is required")
    .isISO8601()
    .withMessage("Invalid date format"),

  check("priority")
    .notEmpty()
    .withMessage("Priority is required")
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be 'low', 'medium', or 'high'"),

  check("projectId")
    .notEmpty()
    .withMessage("Project ID is required")
    .isMongoId()
    .withMessage("Invalid Project ID"),

  check("assignees")
    .isArray({ min: 1 })
    .withMessage("At least one assignee is required")
    .custom((assignees) => assignees.every((id) => /^[a-fA-F0-9]{24}$/.test(id)))
    .withMessage("Invalid assignee ID format"),

  handleValidationErrors,
];
