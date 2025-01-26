// src/pages/App/projects/ProjectDetails.tsx

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ProjectSummaryTab from "../../../components/ProjectSummaryTab";
import ProjectActivityTab from "../../../components/ProjectActivityTab"; // Correct component usage
import ProjectComments from "../../../components/ProjectComments";
import axios from "axios";
import toast from "react-hot-toast";

// Import FaSpinner and FaArrowLeft from react-icons for loading spinner and back button
import { FaSpinner, FaArrowLeft } from "react-icons/fa";

interface Project {
  _id: string;
  name: string;
  client: any;
  departments: any[];
  members: any[];
  startDate: string;
  dueDate: string;
  projectBudget: number;
  status: string;
  priority: string;
  progress: string;
  activities: any[];
}

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>(); // Using useParams to get projectId
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("User is not authenticated.");
          setLoading(false);
          return;
        }

        const response = await axios.get<Project>(`${API_URL}/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data) {
          setProject(response.data);
        } else {
          setError("Project not found.");
        }
      } catch (err: any) {
        console.error("Error fetching project:", err);
        setError(err.response?.data?.message || "Failed to load project.");
        toast.error(err.response?.data?.message || "Failed to load project.");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, API_URL]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-3xl text-gray-500" />
        <span className="ml-2 text-gray-500">Loading Project...</span>
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  if (!project)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Project not found.</p>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* "Back to Projects" button */}
      <Link
        to="/projects"
        className="flex items-center text-blue-500 text-lg font-semibold hover:text-blue-700 transition duration-300 mb-4"
      >
        <FaArrowLeft className="mr-2" /> Back to Projects
      </Link>
      <h1 className="text-4xl font-bold mb-6">{project.name}</h1>

      {/* Button Navigation for Summary, Activities, Comments */}
      <div className="flex space-x-6 mb-6 border-b pb-4">
        <button
          onClick={() => setActiveTab("summary")}
          className={`py-2 px-6 focus:outline-none text-lg font-semibold rounded-lg transition-all ${
            activeTab === "summary"
              ? "bg-orange-500 text-white"
              : "bg-white text-orange-500 border border-orange-500"
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`py-2 px-6 focus:outline-none text-lg font-semibold rounded-lg transition-all ${
            activeTab === "activity"
              ? "bg-green-500 text-white"
              : "bg-white text-green-500 border border-green-500"
          }`}
        >
          Activities
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`py-2 px-6 focus:outline-none text-lg font-semibold rounded-lg transition-all ${
            activeTab === "comments"
              ? "bg-yellow-500 text-white"
              : "bg-white text-yellow-500 border border-yellow-500"
          }`}
        >
          Comments
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "summary" && project && <ProjectSummaryTab project={project} />}
        {activeTab === "activity" && project && <ProjectActivityTab project={project} />}
        {activeTab === "comments" && project && <ProjectComments projectId={project._id} />}
      </div>
    </div>
  );
};

export default ProjectDetails;
