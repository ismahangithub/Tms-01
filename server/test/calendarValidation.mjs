import { query, validationResult } from "express-validator";

export const validateCalendarQuery = [
  query("department")
    .optional()
    .isMongoId()
    .withMessage("Invalid department ID format"),
  query("project")
    .optional()
    .isMongoId()
    .withMessage("Invalid project ID format"),
  query("startDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid startDate format"),
  query("endDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid endDate format"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
