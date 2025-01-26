import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaReply } from 'react-icons/fa';

/** -----------------------------
 *  Type Definitions
 * ----------------------------- */

interface Comment {
  _id: string;
  author: {
    firstName: string;
    lastName: string;
    email: string;
  };
  content: string;
  createdAt: string;
  replies?: Comment[]; // Optional replies array
}

interface ProjectCommentsProps {
  projectId: string;
}

/** -----------------------------
 *  ProjectComments Component
 * ----------------------------- */

const ProjectComments: React.FC<ProjectCommentsProps> = ({ projectId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  // Fetch comments for the project
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("User is not authenticated.");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_URL}/api/projects/${projectId}/comments`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setComments(response.data.comments);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load comments.");
        toast.error(err.response?.data?.message || "Failed to load comments.");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchComments();
    }
  }, [API_URL, projectId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      // Optimistic UI update: add the new comment to the UI immediately
      const newCommentData = {
        _id: new Date().getTime().toString(), // Temporarily generate an ID
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        author: {
          firstName: 'Current', // Placeholder name
          lastName: 'User',
          email: 'user@example.com', // Placeholder email
        },
        replies: [],
      };

      setComments([newCommentData, ...comments]);
      setNewComment('');

      const response = await axios.post(
        `${API_URL}/api/projects/${projectId}/comments`,
        { content: newComment.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // After successful server response, update the comment with correct data
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === newCommentData._id
            ? { ...comment, _id: response.data.comment._id } // Update the ID from the server
            : comment
        )
      );

      toast.success("Comment added successfully.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add comment.");
      toast.error(err.response?.data?.message || "Failed to add comment.");
    }
  };

  const handleReply = async (parentCommentId: string) => {
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      // Optimistic UI update: add the reply immediately
      const newReplyData = {
        _id: new Date().getTime().toString(), // Temporarily generate an ID
        content: replyText.trim(),
        createdAt: new Date().toISOString(),
        author: {
          firstName: 'Current', // Placeholder
          lastName: 'User',
          email: 'user@example.com', // Placeholder
        },
      };

      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === parentCommentId
            ? { ...comment, replies: [newReplyData, ...(comment.replies || [])] }
            : comment
        )
      );
      setReplyingTo(null);
      setReplyText('');

      const response = await axios.post(
        `${API_URL}/api/projects/${projectId}/comments`,
        { content: replyText.trim(), parentCommentId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // After successful server response, update the reply with correct data
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === parentCommentId
            ? {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply._id === newReplyData._id
                    ? { ...reply, _id: response.data.comment._id } // Update the ID from the server
                    : reply
                ),
              }
            : comment
        )
      );

      toast.success("Reply added successfully.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add reply.");
      toast.error(err.response?.data?.message || "Failed to add reply.");
    }
  };

  const renderReplies = (replies: Comment[] | undefined) => {
    if (!replies || replies.length === 0) return null;

    return (
      <div className="ml-6 mt-2">
        {replies.map((reply) => (
          <div key={reply._id} className="border-l pl-4 py-1">
            <p className="font-semibold">
              {reply.author.firstName} {reply.author.lastName}
            </p>
            <p>{reply.content}</p>
            <p className="text-sm text-gray-500">
              {new Date(reply.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex justify-center items-center">
        <p className="text-gray-500">Loading Comments...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center">
        <p className="text-red-500">{error}</p>
      </div>
    );

  return (
    <div className="bg-white p-6 rounded-md shadow-md">
      <h2 className="text-2xl font-bold mb-4">Project Comments</h2>

      {/* Add Comment Section */}
      <div className="mb-6">
        <textarea
          className="w-full p-2 border rounded mb-2"
          rows={3}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        ></textarea>
        <button
          onClick={handleAddComment}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Submit Comment
        </button>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <p>No comments yet. Be the first to comment!</p>
      ) : (
        comments.map((comment) => (
          <div key={comment._id} className="border-b py-2">
            <p className="font-semibold">
              {comment.author.firstName} {comment.author.lastName}
            </p>
            <p>{comment.content}</p>
            <p className="text-sm text-gray-500">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
            {/* Reply Button */}
            <button
              onClick={() => setReplyingTo(comment._id)}
              className="mt-2 text-blue-500 hover:underline text-sm flex items-center gap-1"
            >
              <FaReply /> Reply
            </button>
            {/* Reply Input Field */}
            {replyingTo === comment._id && (
              <div className="mt-2">
                <textarea
                  className="w-full p-2 border rounded mb-2"
                  rows={2}
                  placeholder="Enter your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                ></textarea>
                <button
                  onClick={() => handleReply(comment._id)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
                >
                  Submit Reply
                </button>
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            )}
            {/* Display Replies */}
            {renderReplies(comment.replies)}
          </div>
        ))
      )}

      {/* Optional: Add a yellow button for additional actions */}
      {/* <div className="mt-4">
        <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
          Action Button
        </button>
      </div> */}
    </div>
  );
};

export default ProjectComments;
