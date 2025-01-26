import React, { useEffect, useState } from 'react';
import { FaClipboardList, FaTasks, FaBuilding, FaUser, FaCalendarAlt, FaFlag, FaDollarSign } from 'react-icons/fa';
import axios from 'axios'; // For fetching project data

/** -----------------------------
 *  Type Definitions
 * ----------------------------- */

/** Represents a Task Member */
interface TaskMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** Represents a Department */
interface Department {
  id: string;
  name: string;
}

/** Represents a Task */
interface TaskSummaryProps {
  _id: string;
  title: string;
  description?: string;
  members: string[];     // Array of names (assigned users)
  departments?: Department[];   // Array of department objects
  startDate?: string | null;
  dueDate?: string;
  status?: string;
  priority?: string;
  project?: string;         // Project name
  projectId?: string;       // Project ID
  projectBudget?: string;   // Project Budget (formatted string)
  progress?: string;
}

/** TaskSummaryTab Props */
interface TaskSummaryTabProps {
  task: TaskSummaryProps;
}

/** -----------------------------
 *  TaskSummaryTab Component
 * ----------------------------- */
const TaskSummaryTab: React.FC<TaskSummaryTabProps> = ({ task }) => {
  const [projectBudget, setProjectBudget] = useState<string>("N/A"); // State to hold the project budget
  const departments = Array.isArray(task.departments) ? task.departments : [];
  const members = Array.isArray(task.members) ? task.members : [];

  // Generate a comma-separated string of assigned user names (now directly using the `members` array)
  const assignedUsers = members.length > 0 ? members.join(", ") : "None";

  useEffect(() => {
    // Fetch the project budget if projectId exists
    const fetchProjectBudget = async () => {
      if (task.projectId) {
        try {
          console.log(`Fetching project budget for project ID: ${task.projectId}`);
          const response = await axios.get(`/api/projects/${task.projectId}`); // Adjust your API endpoint if necessary

          console.log("Project data fetched:", response.data); // Debugging: log the fetched project data
          const fetchedBudget = response.data.projectBudget;

          // If the budget is not null or undefined, format and display it
          if (fetchedBudget || fetchedBudget === 0) {
            setProjectBudget(`$${fetchedBudget.toLocaleString()}`);
          } else {
            setProjectBudget("N/A");
          }
        } catch (error) {
          console.error("Error fetching project budget:", error);
          setProjectBudget("N/A");
        }
      }
    };

    fetchProjectBudget();
  }, [task.projectId]); // Re-run when the projectId changes

  console.log("Task Data:", task); // Debug: Log the entire task object

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-gray-800">Task Summary</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-600">
        {/* Left Side (Task Details) */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <FaClipboardList className="text-xl text-orange-500" />
            <p><strong className="font-semibold">Task Title:</strong> {task.title}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaBuilding className="text-xl text-green-500" />
            <p><strong className="font-semibold">Project:</strong> {task.project || "N/A"}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaTasks className="text-xl text-blue-500" />
            <p><strong className="font-semibold">Assigned To:</strong> {assignedUsers}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaUser className="text-xl text-purple-500" />
            <p><strong className="font-semibold">Departments:</strong> {departments.map((dept: Department) => dept.name).join(", ") || "N/A"}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaCalendarAlt className="text-xl text-yellow-500" />
            <p><strong className="font-semibold">Start Date:</strong> {task.startDate ? new Date(task.startDate).toLocaleDateString() : "N/A"}</p>
          </div>
        </div>

        {/* Right Side (Additional Task Details) */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <FaCalendarAlt className="text-xl text-yellow-500" />
            <p><strong className="font-semibold">Due Date:</strong> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaDollarSign className="text-xl text-green-500" />
            <p><strong className="font-semibold">Budget:</strong> {projectBudget}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaFlag className="text-xl text-red-500" />
            <p><strong className="font-semibold">Status:</strong> {task.status || "N/A"}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaFlag className="text-xl text-blue-500" />
            <p><strong className="font-semibold">Priority:</strong> {task.priority || "N/A"}</p>
          </div>

          <div className="flex items-center space-x-3">
            <FaFlag className="text-xl text-purple-500" />
            <p><strong className="font-semibold">Progress:</strong> {task.progress || "No progress data"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskSummaryTab;
