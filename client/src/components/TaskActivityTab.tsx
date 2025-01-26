// src/components/TaskActivityTab.tsx

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaSpinner,
  FaEdit,
  FaTrash,
  FaBuilding,
  FaDollarSign,
  FaUser,
} from "react-icons/fa";
import toast from "react-hot-toast";
import EditActivityModal from "./EditActivityModal"; // Separate modal for activities
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/** -----------------------------
 *  Type Definitions
 * ----------------------------- */

/** Represents an Activity */
interface Activity {
  _id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

/** Represents a Task */
interface Task {
  _id: string;
  title: string;
  description?: string;
  members?: string[];
  departments?: string[];
  startDate?: string;
  dueDate?: string;
  status?: string;
  priority?: string;
  project?: string;
  createdAt?: string;
  color?: string;
}

/** Props for TaskActivityTab */
interface TaskActivityTabProps {
  task: Task;
}

/** -----------------------------
 *  TaskActivityTab Component
 * ----------------------------- */
const TaskActivityTab: React.FC<TaskActivityTabProps> = ({ task }) => {
  /** Activity-Level States */
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState<boolean>(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  /** UI States for Editing Activities */
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);

  /** States for Filtering and Sorting (Optional) */
  const [filterAction, setFilterAction] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("dateAsc");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  /** -----------------------------
   *  Fetch Activities for the Task
   * ----------------------------- */
  const fetchActivities = useCallback(async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError(null);

      console.log(
        "Fetching activities from:",
        `${API_URL}/api/tasks/${task._id}/activities`
      );

      const response = await axios.get(
        `${API_URL}/api/tasks/${task._id}/activities`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Optional
          },
        }
      );

      console.log(
        "TaskActivityTab -> fetchActivities -> response:",
        response.data
      );

      // Handle different possible response structures
      if (Array.isArray(response.data)) {
        setActivities(response.data);
      } else if (response.data && Array.isArray(response.data.activities)) {
        setActivities(response.data.activities);
      } else {
        setActivitiesError("Unexpected data format from server.");
        console.error("Unexpected activities data format:", response.data);
      }
    } catch (err: any) {
      console.error("Error fetching activities:", err);
      setActivitiesError(err.response?.data?.message || "Failed to load activities.");
    } finally {
      setActivitiesLoading(false);
    }
  }, [API_URL, task._id]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  /** -----------------------------
   *  Handle Editing an Activity
   * ----------------------------- */
  const handleEditActivity = useCallback((activity: Activity) => {
    setActivityToEdit(activity);
    setIsEditModalOpen(true);
  }, []);

  /** Update Activity in State After Editing */
  const handleUpdateActivity = useCallback((updatedActivity: Activity) => {
    setActivities((prevActivities) =>
      prevActivities.map((a) => (a._id === updatedActivity._id ? updatedActivity : a))
    );
    toast.success("Activity updated successfully.");
  }, []);

  /** -----------------------------
   *  Activity Statistics Calculation
   * ----------------------------- */
  const activityStatistics = React.useMemo(() => {
    const totalActivities = activities.length;
    const createActions = activities.filter(
      (a) => a.action.toLowerCase() === "create"
    ).length;
    const updateActions = activities.filter(
      (a) => a.action.toLowerCase() === "update"
    ).length;
    const deleteActions = activities.filter(
      (a) => a.action.toLowerCase() === "delete"
    ).length;
    const otherActions = totalActivities - createActions - updateActions - deleteActions;

    return {
      totalActivities,
      createActions,
      updateActions,
      deleteActions,
      otherActions,
    };
  }, [activities]);

  /** -----------------------------
   *  Pie Chart Data
   * ----------------------------- */
  const diagramData = [
    { name: "Create", value: activityStatistics.createActions },
    { name: "Update", value: activityStatistics.updateActions },
    { name: "Delete", value: activityStatistics.deleteActions },
    { name: "Other", value: activityStatistics.otherActions },
  ];
  const COLORS = ["#28a745", "#ffc107", "#dc3545", "#17a2b8"];

  /** -----------------------------
   *  Render JSX
   * ----------------------------- */
  return (
    <div className="space-y-6">
      {/* Activity Statistics */}
      <div className="bg-white shadow-md rounded p-6">
        <h5 className="text-lg font-medium mb-4">Activity Statistics</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-100 rounded p-4 text-center">
            <h6 className="text-xl font-semibold">
              {activityStatistics.totalActivities}
            </h6>
            <p className="text-gray-700">Total Activities</p>
          </div>
          <div className="bg-green-100 rounded p-4 text-center">
            <h6 className="text-xl font-semibold">
              {activityStatistics.createActions}
            </h6>
            <p className="text-gray-700">Create Actions</p>
          </div>
          <div className="bg-yellow-100 rounded p-4 text-center">
            <h6 className="text-xl font-semibold">
              {activityStatistics.updateActions}
            </h6>
            <p className="text-gray-700">Update Actions</p>
          </div>
          <div className="bg-red-100 rounded p-4 text-center">
            <h6 className="text-xl font-semibold">
              {activityStatistics.deleteActions}
            </h6>
            <p className="text-gray-700">Delete Actions</p>
          </div>
          <div className="bg-blue-100 rounded p-4 text-center">
            <h6 className="text-xl font-semibold">
              {activityStatistics.otherActions}
            </h6>
            <p className="text-gray-700">Other Actions</p>
          </div>
        </div>
      </div>

      {/* Activity Type Distribution Pie Chart */}
      <div className="bg-white shadow-md rounded p-6">
        <h5 className="text-lg font-medium mb-4">Activity Type Distribution</h5>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={diagramData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {diagramData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Activities Table */}
      <div className="bg-white shadow-md rounded p-6">
        <h5 className="text-lg font-medium mb-4">Activities</h5>

        {/* Loading State */}
        {activitiesLoading ? (
          <div className="flex justify-center items-center py-10">
            <FaSpinner className="animate-spin text-3xl text-gray-500" />
            <span className="ml-2 text-gray-500">Loading activities...</span>
          </div>
        ) : activitiesError ? (
          <div className="text-center text-red-500 py-10">
            <p>{activitiesError}</p>
          </div>
        ) : activities.length === 0 ? (
          <p className="text-gray-700">No activities recorded for this task.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Action</th>
                  <th className="py-2 px-4 border-b">Performed By</th>
                  <th className="py-2 px-4 border-b">Date</th>
                  <th className="py-2 px-4 border-b">Details</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity._id}>
                    <td className="py-2 px-4 border-b">{activity.action}</td>
                    <td className="py-2 px-4 border-b">{activity.performedBy}</td>
                    <td className="py-2 px-4 border-b">
                      {new Date(activity.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 border-b">{activity.details || "N/A"}</td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => handleEditActivity(activity)}
                        className="text-blue-500 hover:text-blue-700 mr-2"
                        title="Edit Activity"
                      >
                        <FaEdit />
                      </button>
                      {/* Add Delete Button if needed */}
                      {/* <button
                        onClick={() => handleDeleteActivity(activity._id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete Activity"
                      >
                        <FaTrash />
                      </button> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Activity Modal */}
      {activityToEdit && (
        <EditActivityModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          activity={activityToEdit}
          onActivityUpdated={handleUpdateActivity}
        />
      )}
    </div>
  );
};

export default TaskActivityTab;
