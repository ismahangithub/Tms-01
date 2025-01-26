import express from "express";
import { getTaskDetails, addComment, uploadAttachment } from "../controllers/taskDetailsController.js";

const router = express.Router();

router.get("/:taskId", getTaskDetails);
router.post("/:taskId/comments", addComment);
router.post("/:taskId/attachments", uploadAttachment);

export default router;
