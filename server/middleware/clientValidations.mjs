import { check, validationResult } from "express-validator";

export const validateClient = [
  check("name")
    .trim()
    .notEmpty()
    .withMessage("The name is required")
    .isLength({ min: 3 })
    .withMessage("The name must be at least 3 characters long"),

  check("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .withMessage("Please enter a valid email format"),

  check("address")
    .trim()
    .notEmpty()
    .withMessage("The address is required"),

  check("phoneNumberOne")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isNumeric()
    .withMessage("Phone number must be a number")
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 digits"),

  (request, response, next) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      const uniqueErrors = {};
      errors.array().forEach((err) => {
        if (!uniqueErrors[err.param]) {
          uniqueErrors[err.param] = err.msg;
        }
      });
      return response.status(400).json({ errors: Object.values(uniqueErrors) });
    }
    next();
  },
];
