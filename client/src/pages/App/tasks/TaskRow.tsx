// src/components/TaskRow.tsx

import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

/** -----------------------------
 *  Type Definitions
 * ----------------------------- */

/** Represents a User */
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** Represents a Task */
interface Task {
  _id: string;
  title: string;
  status: string;
  dueDate: string;
  projectId: string;  // Assumed that Task has a projectId
  projectClientName: string; // Will be fetched if not in the task itself
  projectDepartments: string[]; // Departments of the project
  projectBudget: string;
  projectName: string; // Name of the project
}

/** TaskRow Props */
interface TaskRowProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void; // Passes the entire task
}

/** -----------------------------
 *  TaskRow Component
 * ----------------------------- */
const TaskRow: React.FC<TaskRowProps> = ({ task, onEdit, onDelete }) => {
  const [clientName, setClientName] = useState<string | null>(null); // For the project client

  // Fetch the client information when the task is provided
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("User is not authenticated.");
          return;
        }

        // Fetch the project details to get the client name
        const response = await axios.get(`/api/projects/${task.projectId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Set the client name from the fetched project data
        if (response.data.client && response.data.client.name) {
          setClientName(response.data.client.name);
        } else {
          setClientName("N/A");
        }
      } catch (error) {
        console.error("Error fetching task data:", error);
        toast.error("Error fetching project or assigned users.");
        setClientName("N/A"); // Ensure N/A is set on error
      }
    };

    fetchTaskData();
  }, [task.projectId]);

  /** Determine CSS classes based on task status */
  const getStatusLabelClass = () => {
    const lowerStatus = task.status.toLowerCase();
    switch (lowerStatus) {
      case "completed":
        return "bg-green-200 text-green-800";
      case "in progress":
        return "bg-yellow-200 text-yellow-800";
      case "overdue":
        return "bg-red-200 text-red-800";
      case "pending":
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <tr>
      {/* Title */}
      <td className="py-2 px-4 border-b">{task.title}</td>

      {/* Status */}
      <td className="py-2 px-4 border-b">
        <span className={`px-2 py-1 rounded ${getStatusLabelClass()}`}>
          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
        </span>
      </td>

      {/* Due Date */}
      <td className="py-2 px-4 border-b">
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}
      </td>

      {/* Client */}
      <td className="py-2 px-4 border-b">
        {clientName || "N/A"}
      </td>

      {/* Actions */}
      <td className="py-2 px-4 border-b">
        {/* Edit Button */}
        <button
          onClick={() => onEdit(task)}
          className="mr-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
        >
          <FaEdit />
          Edit
        </button>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(task)}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
        >
          <FaTrash />
          Delete
        </button>
      </td>
    </tr>
  );
};

export default TaskRow;
