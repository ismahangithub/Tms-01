// src/components/ProjectActivityTab.tsx

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";
import TaskRow from "../pages/App/tasks/TaskRow"; // Corrected import path
import EditTaskModal from "../pages/App/tasks/EditTaskModal"; // Corrected import path
import DeleteTask from "../pages/App/tasks/DeleteTask"; // Corrected import path
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

/** Represents a Department within a Project */
interface Department {
  _id: string;
  name: string;
}

/** Represents a Team Member in a Project */
interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

/** Represents a Project */
interface Project {
  _id: string;
  name: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  status?: string;
  progress?: string;
  departments: Department[];
  members: Member[];
  projectBudget: number;
  priority?: string;
}

/** Represents a Task */
interface Task {
  _id: string;
  title: string;
  status: string;
  dueDate: string;
  projectId: string;  // Assumed that Task has a projectId
  projectClientName: string; // Fetched from backend
  projectDepartments: string[]; // Departments of the project
  projectBudget: string; // Formatted budget
  projectName: string; // Name of the project
}

/** Backend Response for Fetching Tasks */
interface GetTasksResponse {
  tasks: Task[];
  pagination: {
    totalTasks: number;
    currentPage: number;
    totalPages: number;
  };
}

/** Props for ProjectActivityTab */
interface ProjectActivityTabProps {
  project: Project;
}

/** -----------------------------
 *  ProjectActivityTab Component
 * ----------------------------- */
const ProjectActivityTab: React.FC<ProjectActivityTabProps> = ({ project }) => {
  /** Task-Level States */
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(true);
  const [tasksError, setTasksError] = useState<string | null>(null);

  /** UI States for Editing Tasks */
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  /** UI States for Deleting Tasks */
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  /** States for Filtering and Sorting */
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("dueDateAsc");

  /** -----------------------------
   *  useEffect Hooks
   * ----------------------------- */

  /** Fetch Tasks for the Project */
  const fetchTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      setTasksError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("User is not authenticated.");
        setTasksLoading(false);
        return;
      }

      const params: any = { project: project._id };

      // Apply Status Filter if not "all"
      if (filterStatus !== "all") {
        params.status = filterStatus;
      }

      // Apply Sorting
      if (sortOption === "dueDateAsc") {
        params.sort = "dueDate";
        params.order = "asc";
      } else if (sortOption === "dueDateDesc") {
        params.sort = "dueDate";
        params.order = "desc";
      } else if (sortOption === "status") {
        params.sort = "status";
        params.order = "asc";
      }

      // Fetch Tasks
      const response = await axios.get<GetTasksResponse>("/api/tasks", {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("ProjectActivityTab -> fetchTasks -> response:", response.data);

      if (response.data.tasks && Array.isArray(response.data.tasks)) {
        const fetchedTasks = response.data.tasks;

        // Map Tasks to Include Formatted Budget
        const tasksWithFormattedBudget: Task[] = fetchedTasks.map((task) => ({
          ...task,
          projectBudget: task.projectBudget !== "N/A" ? task.projectBudget : "$0",
        }));

        setTasks(tasksWithFormattedBudget);
      } else {
        setTasksError("No tasks found.");
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      setTasksError(error.response?.data?.message || "Failed to load tasks.");
      toast.error(error.response?.data?.message || "Failed to load tasks.");
    } finally {
      setTasksLoading(false);
    }
  }, [project, filterStatus, sortOption]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /** -----------------------------
   *  Event Handlers
   * ----------------------------- */

  /** Handle Editing a Task */
  const handleEditTask = useCallback((task: Task) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
  }, []);

  /** Update Task in State After Editing */
  const handleUpdateTask = useCallback((updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t))
    );
    toast.success("Task updated successfully.");
  }, []);

  /** Handle Deleting a Task - Open Delete Modal */
  const handleDeleteTask = useCallback((task: Task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  }, []);

  /** Confirm Deletion of Task */
  const confirmDeleteTask = useCallback(async () => {
    if (!taskToDelete) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      await axios.delete(`/api/tasks/${taskToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTasks((prevTasks) => prevTasks.filter((t) => t._id !== taskToDelete._id));
      toast.success("Task deleted successfully.");
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast.error(error.response?.data?.message || "Failed to delete task.");
    } finally {
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
      fetchTasks(); // Refetch tasks after deletion
    }
  }, [taskToDelete, fetchTasks]);

  /** -----------------------------
   *  Task Statistics Calculation
   * ----------------------------- */
  const taskStatistics = React.useMemo(() => {
    const totalTasks = tasks.length;
    const completed = tasks.filter(
      (t) => t.status.toLowerCase() === "completed"
    ).length;
    const inProgress = tasks.filter(
      (t) => t.status.toLowerCase() === "in progress"
    ).length;
    const pending = tasks.filter(
      (t) => t.status.toLowerCase() === "pending"
    ).length;
    const overdue = tasks.filter(
      (t) =>
        t.status.toLowerCase() !== "completed" &&
        new Date(t.dueDate) < new Date()
    ).length;

    return {
      totalTasks,
      completed,
      inProgress,
      pending,
      overdue,
    };
  }, [tasks]);

  /** -----------------------------
   *  Pie Chart Data
   * ----------------------------- */
  const diagramData = [
    { name: "Completed", value: taskStatistics.completed },
    { name: "In Progress", value: taskStatistics.inProgress },
    { name: "Pending", value: taskStatistics.pending },
    { name: "Overdue", value: taskStatistics.overdue },
  ];
  const COLORS = ["#28a745", "#ffc107", "#17a2b8", "#dc3545"];

  /** -----------------------------
   *  Render JSX
   * ----------------------------- */
  return (
    <div className="space-y-6">
      {/* Task Statistics */}
      <div className="bg-white shadow-md rounded p-6">
        <h5 className="text-lg font-medium mb-4">Task Statistics</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-100 rounded p-4 text-center">
            <h6 className="text-xl font-semibold">{taskStatistics.totalTasks}</h6>
            <p className="text-gray-700">Total Tasks</p>
          </div>
          <div className="bg-green-100 rounded p-4 text-center">
            <h6 className="text-xl font-semibold">{taskStatistics.completed}</h6>
            <p className="text-gray-700">Completed</p>
          </div>
          <div className="bg-yellow-100 rounded p-4 text-center">
            <h6 className="text-xl font-semibold">{taskStatistics.inProgress}</h6>
            <p className="text-gray-700">In Progress</p>
          </div>
          <div className="bg-blue-100 rounded p-4 text-center">
            <h6 className="text-xl font-semibold">{taskStatistics.pending}</h6>
            <p className="text-gray-700">Pending</p>
          </div>
          <div className="bg-red-100 rounded p-4 text-center">
            <h6 className="text-xl font-semibold">{taskStatistics.overdue}</h6>
            <p className="text-gray-700">Overdue</p>
          </div>
        </div>
      </div>

      {/* Task Status Distribution Pie Chart */}
      <div className="bg-white shadow-md rounded p-6">
        <h5 className="text-lg font-medium mb-4">Task Status Distribution</h5>
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
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tasks Table */}
      <div className="bg-white shadow-md rounded p-6">
        <h5 className="text-lg font-medium mb-4">Tasks</h5>

        {/* Loading State */}
        {tasksLoading ? (
          <div className="flex justify-center items-center py-10">
            <FaSpinner className="animate-spin text-3xl text-gray-500" />
            <span className="ml-2 text-gray-500">Loading tasks...</span>
          </div>
        ) : tasksError ? (
          <div className="text-center text-red-500 py-10">
            <p>{tasksError}</p>
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-gray-700">No tasks assigned to this project.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Title</th>
                  <th className="py-2 px-4 border-b">Status</th>
                  <th className="py-2 px-4 border-b">Due Date</th>
                  <th className="py-2 px-4 border-b">Client</th>
                  <th className="py-2 px-4 border-b">Assigned To</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <TaskRow
                    key={task._id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Task Modal */}
      {taskToEdit && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          task={taskToEdit}
          onTaskUpdated={handleUpdateTask}
        />
      )}

      {/* Delete Task Modal */}
      {taskToDelete && (
        <DeleteTask
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          taskId={taskToDelete._id}
          onDeleted={confirmDeleteTask}
        />
      )}
    </div>
  );
};

export default ProjectActivityTab;
