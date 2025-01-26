import { query, validationResult } from "express-validator";

export const validateReportQuery = [
  query("client").optional().isMongoId().withMessage("Invalid client ID"),
  query("project").optional().isMongoId().withMessage("Invalid project ID"),
  query("user").optional().isMongoId().withMessage("Invalid user ID"),
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
