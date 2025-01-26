import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./configs/db.mjs";
import { PORT } from "./configs/config.mjs";
import routes from "./routes/index.mjs"; // Centralized routes
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// Database Connection
(async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1); // Exit process on DB connection failure
  }
})();

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cookieParser()); // Parse cookies
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", // Allow frontend origin
    credentials: true, // Allow cookies and credentials
  })
);

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

// Use Centralized Routes
app.use("/api", routes);

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "An internal server error occurred.",
  });
});

// Start the Server
const port = PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
