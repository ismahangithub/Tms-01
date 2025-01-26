// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { FaSpinner, FaCheckCircle } from "react-icons/fa";

// interface Comment {
//   _id: string;
//   userId: string;
//   text: string;
//   createdAt: string;
// }

// interface CommentsTabProps {
//   projectId: string;
// }

// const CommentsTab: React.FC<CommentsTabProps> = ({ projectId }) => {
//   const [comments, setComments] = useState<Comment[]>([]);
//   const [newComment, setNewComment] = useState<string>("");
//   const [loading, setLoading] = useState<boolean>(false);

//   const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

//   useEffect(() => {
//     const fetchComments = async () => {
//       try {
//         const response = await axios.get(`${API_URL}/api/projects/${projectId}/comments`);
//         setComments(response.data.comments);
//       } catch (error) {
//         console.error("Error fetching comments:", error);
//         toast.error("Failed to load comments.");
//       }
//     };

//     fetchComments();
//   }, [projectId]);

//   const handleCommentSubmit = async () => {
//     if (!newComment.trim()) return;

//     setLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         toast.error("You must be logged in to add a comment.");
//         return;
//       }

//       const response = await axios.post(
//         `${API_URL}/api/projects/${projectId}/comments`,
//         { text: newComment },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       setComments((prevComments) => [response.data.comment, ...prevComments]);
//       setNewComment(""); // Reset input field
//       toast.success("Comment added successfully!");

//       // Optional: Email notification
//       await axios.post(`${API_URL}/api/send-email`, {
//         subject: "New Comment on Project",
//         body: `A new comment has been posted on the project: ${response.data.comment.text}`,
//         to: "user@example.com", // Use dynamic email
//       });
//     } catch (error) {
//       console.error("Error sending comment:", error);
//       toast.error("Failed to send comment.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-4 bg-white rounded-md shadow-md">
//       <h2 className="text-xl font-bold mb-4">Project Comments</h2>
//       <div className="mb-4">
//         <textarea
//           value={newComment}
//           onChange={(e) => setNewComment(e.target.value)}
//           className="w-full p-2 border rounded-md"
//           placeholder="Write a comment..."
//           rows={4}
//         />
//         <button
//           onClick={handleCommentSubmit}
//           className="mt-2 bg-teal-600 text-white p-2 rounded-md"
//           disabled={loading}
//         >
//           {loading ? (
//             <FaSpinner className="animate-spin" />
//           ) : (
//             <FaCheckCircle />
//           )}
//           {loading ? "Sending..." : "Add Comment"}
//         </button>
//       </div>

//       <div>
//         {comments.length === 0 ? (
//           <p>No comments yet. Be the first to comment!</p>
//         ) : (
//           comments.map((comment) => (
//             <div key={comment._id} className="border-b py-2">
//               <p className="font-semibold">{comment.userId}</p>
//               <p>{comment.text}</p>
//               <p className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default CommentsTab;
