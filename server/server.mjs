// server/index.js (or server/app.mjs)

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./configs/db.mjs"; // Your DB connection logic
import { PORT } from "./configs/config.mjs"; 
import routes from "./routes/index.mjs"; // Centralized routes

dotenv.config();
const app = express();

// Connect to DB
(async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
})();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Logging Middleware (optional, but nice for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

// Mount your API on /api
app.use("/api", routes); 
// Example calls: /api/comments, /api/departments, etc.

// Centralized Error Handling
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "An internal server error occurred.",
  });
});

// Start the Server
const port = PORT || 8001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
