// server/controller/commentController.mjs

import Comment from "../models/CommentModel.mjs"; // Ensure the path is correct
import Project from "../models/Project Model.mjs"; // Ensure the path is correct
import Task from "../models/Task.mjs";            // Ensure the path is correct
import mongoose from "mongoose";

/**
 * Controller to create a new comment
 * Supports comments on both projects and tasks
 */
export const createComment = async (req, res) => {
  try {
    const { projectId, taskId } = req.params; // Extract projectId or taskId from route parameters
    const { content, parentCommentId } = req.body; // Extract content and parentCommentId from request body

    // Ensure that either projectId or taskId is present
    if (!projectId && !taskId) {
      return res.status(400).json({ message: "Comment must be associated with a project or a task." });
    }

    // Ensure that if projectId is present, taskId is not, and vice versa
    if (projectId && taskId) {
      return res.status(400).json({ message: "Comment cannot be associated with both a project and a task." });
    }

    // Validate content
    if (!content || typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ message: "Content is required and must be a non-empty string." });
    }

    // Create the comment object
    const commentData = {
      content: content.trim(),
      author: req.user._id, // Ensure req.user is defined via authentication middleware
    };

    if (projectId) {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: "Invalid Project ID." });
      }
      commentData.project = projectId;
    }

    if (taskId) {
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: "Invalid Task ID." });
      }
      commentData.task = taskId;
    }

    if (parentCommentId) {
      if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
        return res.status(400).json({ message: "Invalid Parent Comment ID." });
      }
      commentData.parentComment = parentCommentId;
    }

    // Create and save the comment
    const newComment = new Comment(commentData);
    await newComment.save();

    // Populate the author field for the response
    await newComment.populate({
      path: "author",
      select: "firstName lastName email",
    });

    // Optionally, populate parentComment if it's a reply
    if (parentCommentId) {
      await newComment.populate({
        path: "parentComment",
        select: "content author",
        populate: {
          path: "author",
          select: "firstName lastName email",
        },
      });
    }

    res.status(201).json({ comment: newComment });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Failed to create comment." });
  }
};

/**
 * Controller to get all comments for a project or task
 * Supports nested replies
 */
export const getComments = async (req, res) => {
  try {
    const { projectId, taskId } = req.params; // Extract projectId or taskId from route parameters

    // Ensure that either projectId or taskId is present
    if (!projectId && !taskId) {
      return res.status(400).json({ message: "Must specify a project or a task to get comments." });
    }

    // Build the query
    const query = {};
    if (projectId) query.project = projectId;
    if (taskId) query.task = taskId;

    // Fetch comments, populate author, populate replies recursively, sort by createdAt descending
    const comments = await Comment.find(query)
      .populate({
        path: "author",
        select: "firstName lastName email",
      })
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "firstName lastName email",
        },
      })
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments." });
  }
};
