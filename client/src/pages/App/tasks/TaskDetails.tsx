// src/pages/App/tasks/TaskDetails.tsx

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import TaskSummaryTab from "../../../components/TaskSummaryTab";
import TaskComments from "../../../components/TaskComments";
// If you have a TaskActivityTab component, import it here
// import TaskActivityTab from "../../../components/TaskActivityTab";

import axios from "axios";
import toast from "react-hot-toast";

// Import icons from react-icons
import { FaSpinner, FaArrowLeft } from "react-icons/fa";

/** -----------------------------
 *  Type Definitions
 * ----------------------------- */

/** Represents a Task */
interface Project {
  _id: string;
  name: string;
  // Add other project-related fields if necessary
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  project: Project;
  assignedTo: User[];
  startDate?: string;
  dueDate?: string;
  status?: string;
  priority?: string;
  progress?: string;
  createdAt?: string;
  color?: string;
  departments?: string[];
  members?: string[];
  // If you have activities, include them here
  // activities?: Activity[];
}

/** -----------------------------
 *  TaskDetails Component
 * ----------------------------- */

const TaskDetails: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<string>("summary"); // Default to 'summary'
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("User is not authenticated.");
          setLoading(false);
          navigate("/auth/login");
          return;
        }

        const response = await axios.get<Task>(`${API_URL}/api/tasks/${taskId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data) {
          setTask(response.data);
        } else {
          setError("Task not found.");
        }
      } catch (err: any) {
        console.error("Error fetching task:", err);
        setError(err.response?.data?.message || "Failed to load task.");
        toast.error(err.response?.data?.message || "Failed to load task.");
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTask();
    }
  }, [taskId, API_URL, navigate]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-3xl text-gray-500" />
        <span className="ml-2 text-gray-500">Loading Task...</span>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Link to="/apps/tasks" className="text-blue-500 hover:underline">
          Go back to Tasks
        </Link>
      </div>
    );

  if (!task)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Task not found.</p>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Back Link with Icon */}
      <Link
        to="/apps/tasks"
        className="flex items-center text-blue-500 hover:text-blue-700 mb-4"
      >
        <FaArrowLeft className="mr-2" /> Back to Tasks
      </Link>

      {/* Task Title */}
      <h1 className="text-3xl font-bold mb-6">{task.title}</h1>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("summary")}
          className={`py-2 px-4 focus:outline-none text-lg font-semibold rounded-lg transition-all ${
            activeTab === "summary"
              ? "bg-orange-500 text-white"
              : "bg-white text-orange-500 border border-orange-500 hover:bg-orange-50"
          }`}
        >
          Summary
        </button>
        {/* If TaskActivityTab is available, include it */}
        {/*
        <button
          onClick={() => setActiveTab("activity")}
          className={`py-2 px-4 focus:outline-none text-lg font-semibold rounded-lg transition-all ${
            activeTab === "activity"
              ? "bg-green-500 text-white"
              : "bg-white text-green-500 border border-green-500 hover:bg-green-50"
          }`}
        >
          Activities
        </button>
        */}
        <button
          onClick={() => setActiveTab("comments")}
          className={`py-2 px-4 focus:outline-none text-lg font-semibold rounded-lg transition-all ${
            activeTab === "comments"
              ? "bg-yellow-500 text-white"
              : "bg-white text-yellow-500 border border-yellow-500 hover:bg-yellow-50"
          }`}
        >
          Comments
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "summary" && task && <TaskSummaryTab task={task} />}
        {/* If TaskActivityTab is available, include it */}
        {/* {activeTab === "activity" && task && <TaskActivityTab task={task} />} */}
        {activeTab === "comments" && task && <TaskComments taskId={task._id} />}
      </div>
    </div>
  );
};

export default TaskDetails;
