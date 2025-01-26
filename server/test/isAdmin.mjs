import jwt from "jsonwebtoken"; // Import jsonwebtoken
import { JWT_SECRET } from "../configs/config.mjs";

export const isAdmin = (req, res, next) => {
  try {
    console.log("isAdmin middleware triggered.");

    // Extract token from cookies or Authorization header
    const token =
      req.cookies?.token ||
      (req.headers["authorization"]?.startsWith("Bearer ") &&
        req.headers["authorization"].split(" ")[1]);

    if (!token) {
      console.warn("No token provided in request.");
      return res.status(403).json({
        status: "error",
        message: "Access denied. Admin permissions required.",
      });
    }
    console.log("Token extracted successfully:", token);

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET); // Fix here: jwt was not defined
    console.log("Token decoded successfully:", decoded);

    // Check if the role is Admin
    if (decoded.role !== "Admin") {
      console.warn("Access denied. User is not an admin:", decoded.role);
      return res.status(403).json({
        status: "error",
        message: "Access denied. Admin permissions required.",
      });
    }

    // Attach the decoded user information to the request object
    req.user = decoded;
    console.log("Admin check passed. Proceeding to next middleware...");

    // Proceed to the next middleware or controller
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);

    const message =
      error.name === "TokenExpiredError"
        ? "Session expired. Please log in again."
        : "Invalid or malformed token. Please log in again.";

    return res.status(401).json({
      status: "error",
      message,
    });
  }
};
