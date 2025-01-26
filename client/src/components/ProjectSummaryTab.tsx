import React from 'react';
import { FaEdit, FaUser, FaBuilding, FaCalendarAlt, FaDollarSign, FaTasks, FaFlag, FaClipboardList } from 'react-icons/fa';

interface Project {
  _id: string;
  name: string;
  client: any;
  department: any[];  // Ensure this is an array
  members: any[];     // Ensure this is an array
  startDate: string;
  dueDate: string;
  projectBudget: number;
  status: string;
  priority: string;
  progress: string;
  activities: any[];
}

interface ProjectSummaryTabProps {
  project: Project;
}

const ProjectSummaryTab: React.FC<ProjectSummaryTabProps> = ({ project }) => {
  // Default to empty array if department or members are not defined
  const departments = Array.isArray(project.department) ? project.department : [];
  const members = Array.isArray(project.members) ? project.members : [];

  const activitiesCount = project.activities ? project.activities.length : 0;

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-gray-800">Project Summary</h2>
        {/* Edit Icon */}
        {/* <button className="text-blue-500 hover:text-blue-700 transition duration-300">
          <FaEdit className="text-xl" />
        </button> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-600">
        {/* Left Side (Project Details) */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <FaClipboardList className="text-xl text-orange-500" />
            <p><strong className="font-semibold">Project Name:</strong> {project.name}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <FaBuilding className="text-xl text-green-500" />
            <p><strong className="font-semibold">Client:</strong> {project.client?.name || "N/A"}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaTasks className="text-xl text-blue-500" />
            <p><strong className="font-semibold">Department(s):</strong> {departments.map((dept: any) => dept.name).join(", ") || "N/A"}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaUser className="text-xl text-purple-500" />
            <p><strong className="font-semibold">Members:</strong> {members.map((member: any) => `${member.firstName} ${member.lastName}`).join(", ") || "None"}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaCalendarAlt className="text-xl text-yellow-500" />
            <p><strong className="font-semibold">Start Date:</strong> {new Date(project.startDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Right Side (Additional Details) */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <FaCalendarAlt className="text-xl text-yellow-500" />
            <p><strong className="font-semibold">Due Date:</strong> {new Date(project.dueDate).toLocaleDateString()}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaDollarSign className="text-xl text-green-500" />
            <p><strong className="font-semibold">Budget:</strong> ${project.projectBudget.toLocaleString()}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaFlag className="text-xl text-red-500" />
            <p><strong className="font-semibold">Status:</strong> {project.status}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaFlag className="text-xl text-blue-500" />
            <p><strong className="font-semibold">Priority:</strong> {project.priority}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaFlag className="text-xl text-purple-500" />
            <p><strong className="font-semibold">Progress:</strong> {project.progress || 'No progress data'}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaTasks className="text-xl text-yellow-600" />
            <p><strong className="font-semibold">Activities:</strong> {activitiesCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSummaryTab;
