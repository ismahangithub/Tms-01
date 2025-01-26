// server/routes/commentRoutes.mjs

import express from "express";
import { createComment, getComments } from "../controller/commentController.mjs";
import { authenticateUser } from "../middleware/authMiddleware.mjs";

const router = express.Router({ mergeParams: true }); // Enable parameter merging

/**
 * Create a new comment
 * POST /:projectId/comments/ or POST /:taskId/comments/
 */
router.post("/", authenticateUser, createComment);

/**
 * Get all comments
 * GET /:projectId/comments/ or GET /:taskId/comments/
 */
router.get("/", authenticateUser, getComments);

export default router;
