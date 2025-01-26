// src/pages/Index.tsx

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
} from "chart.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card"; // Ensure these components are correctly defined
import DatePicker from "react-datepicker"; // Ensure react-datepicker is installed
import "react-datepicker/dist/react-datepicker.css";
import { FaCheckCircle, FaHourglassHalf, FaExclamationCircle, FaSpinner } from "react-icons/fa";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement
);

// Define Interfaces for Data Types
interface ProjectSummary {
  _id: string;
  count: number;
}

interface TaskSummary {
  _id: string;
  count: number;
}

interface UserSummary {
  _id: string;
  firstName: string;
  lastName: string;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

interface ReportSummary {
  _id: string;
  count: number;
}

interface BudgetSummary {
  totalBudget: number;
  completedBudget: number;
  remainingBudget: number;
}

interface Task {
  _id: string;
  taskName: string;
  description: string;
  status: string;
  dueDate: string; // ISO string
  startDate: string | null; // ISO string or null
  members: string[]; // Ensure members is always an array
  project: string;
  projectId: string;
  createdAt: string; // ISO string
  priority: string;
  // color: string; // Removed from model
  departments: { id: string; name: string }[];
  activities: {
    action: string;
    performedBy: string;
    details: string;
    date: string; // ISO string
  }[];
  completedDate?: string; // Optional field for completed date
}

interface Client {
  _id: string;
  name: string;
  industry: string;
  location: string;
  // Add other relevant fields as needed
}

interface DashboardData {
  clients: Client[];
  projectSummary: ProjectSummary[];
  taskSummary: TaskSummary[];
  userSummary: UserSummary[];
  reportSummary: ReportSummary[];
  budgetSummary: BudgetSummary;
  recentTasks: Task[]; // Renamed for clarity
  clientStatusCounts: {
    ongoingClients: number;
    verifiedClients: number;
    notInProjectClients: number;
  };
}

// StatCard Component
const StatCard: React.FC<{ label: string; count: number | string; color: string }> = ({
  label,
  count,
  color,
}) => {
  return (
    <div
      className={`p-6 rounded-lg ${color} shadow flex flex-col justify-center items-center transition-transform transform hover:scale-105`}
      style={{ minHeight: "150px", overflowX: "auto" }} // Added overflowX to prevent overflow
    >
      <h3 className="text-4xl font-bold text-center">{count}</h3>
      <p className="text-center mt-2 text-lg">{label}</p>
    </div>
  );
};

// Utility function to validate ObjectId
const isValidObjectId = (id: string) => /^[a-fA-F0-9]{24}$/.test(id);

// Function to get status icons
const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return <FaCheckCircle className="text-green-500" title="Completed" />;
    case "in progress":
      return <FaSpinner className="text-blue-500 animate-spin" title="In Progress" />;
    case "pending":
      return <FaHourglassHalf className="text-yellow-500" title="Pending" />;
    case "overdue":
      return <FaExclamationCircle className="text-red-500" title="Overdue" />;
    case "to do":
      return <FaHourglassHalf className="text-gray-500" title="To Do" />;
    default:
      return null;
  }
};

// Dashboard Content Component
const DashboardContent: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    clients: [],
    projectSummary: [],
    taskSummary: [],
    userSummary: [],
    reportSummary: [],
    budgetSummary: {
      totalBudget: 0,
      completedBudget: 0,
      remainingBudget: 0,
    },
    recentTasks: [],
    clientStatusCounts: {
      ongoingClients: 0,
      verifiedClients: 0,
      notInProjectClients: 0,
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  // Filter States for Each Section

  // Projects
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>("all");

  // Tasks
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>("all");
  const [taskDueStartDate, setTaskDueStartDate] = useState<Date | null>(null);
  const [taskDueEndDate, setTaskDueEndDate] = useState<Date | null>(null);

  // Clients
  const [clientIndustryFilter, setClientIndustryFilter] = useState<string>("all");
  const [clientLocationFilter, setClientLocationFilter] = useState<string>("all");

  // Users
  const [userStartDate, setUserStartDate] = useState<Date | null>(null);
  const [userEndDate, setUserEndDate] = useState<Date | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("all"); // Added for user-specific filter

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get("http://localhost:8001/api/dashboard"); // Ensure the correct URL
        console.log("API Response: ", response.data);

        // Ensure all tasks have a defined 'members' array
        const recentTasksWithMembers = response.data.recentTasks.map((task: Task) => ({
          ...task,
          members: Array.isArray(task.members) ? task.members : [],
        }));

        setData({
          clients: response.data.clients || [],
          projectSummary: response.data.projectSummary || [],
          taskSummary: response.data.taskSummary || [],
          userSummary: response.data.userSummary || [],
          reportSummary: response.data.reportSummary || [],
          budgetSummary: {
            totalBudget: response.data.budgetSummary?.totalBudget || 0,
            completedBudget: response.data.budgetSummary?.completedBudget || 0,
            remainingBudget: response.data.budgetSummary?.remainingBudget || 0,
          },
          recentTasks: recentTasksWithMembers,
          clientStatusCounts: response.data.clientStatusCounts || {
            ongoingClients: 0,
            verifiedClients: 0,
            notInProjectClients: 0,
          },
        });

        setIsLoading(false);
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        setIsError(true);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Filtered Data States
  const [filteredProjects, setFilteredProjects] = useState<ProjectSummary[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskSummary[]>([]);
  const [filteredUserSummary, setFilteredUserSummary] = useState<UserSummary[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  // Apply Filters to Projects
  useEffect(() => {
    if (!data) return;

    let filtered = data.projectSummary;

    // Filter by Status
    if (projectStatusFilter !== "all") {
      filtered = filtered.filter((project) => project._id === projectStatusFilter);
    }

    setFilteredProjects(filtered || []);
  }, [projectStatusFilter, data]);

  // Apply Filters to Tasks
  useEffect(() => {
    if (!data) return;

    let filtered = data.taskSummary;

    // Filter by Status
    if (taskStatusFilter !== "all") {
      filtered = filtered.filter((task) => task._id === taskStatusFilter);
    }

    // Filter by Priority
    if (taskPriorityFilter !== "all") {
      filtered = filtered.filter((task) => task._id === taskPriorityFilter);
    }

    // Due Date Range Filtering
    if (taskDueStartDate || taskDueEndDate) {
      // Filter tasks based on dueDate
      const dueFilteredTasks = data.recentTasks.filter((task) => {
        const dueDate = new Date(task.dueDate);
        if (taskDueStartDate && dueDate < taskDueStartDate) return false;
        if (taskDueEndDate && dueDate > taskDueEndDate) return false;
        return true;
      });

      // Aggregate task counts based on the filtered tasks
      const statusCounts: { [key: string]: number } = {};
      dueFilteredTasks.forEach((task) => {
        const status = task.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Transform statusCounts into TaskSummary[]
      filtered = Object.keys(statusCounts).map((status) => ({
        _id: status,
        count: statusCounts[status],
      }));
    }

    setFilteredTasks(filtered);
  }, [
    taskStatusFilter,
    taskPriorityFilter,
    taskDueStartDate,
    taskDueEndDate,
    data,
  ]);

  // Apply Filters to Users based on Task Completion Date Range and Selected User
  useEffect(() => {
    if (!data) return;

    let filtered = data.userSummary;

    // Filter by Selected User
    if (selectedUserId !== "all" && isValidObjectId(selectedUserId)) {
      filtered = filtered.filter((user) => user._id === selectedUserId);
    }

    // Filter by Completion Date Range
    if (userStartDate || userEndDate) {
      // Filter tasks based on completedDate
      const filteredTasks = data.recentTasks.filter((task) => {
        if (!task.completedDate) return false;
        const completionDate = new Date(task.completedDate);
        if (userStartDate && completionDate < userStartDate) return false;
        if (userEndDate && completionDate > userEndDate) return false;
        return true;
      });

      // Map user IDs to the number of completed, pending, and overdue tasks within the filtered date range
      const userTaskMap: { [key: string]: { completed: number; pending: number; overdue: number } } = {};

      filteredTasks.forEach((task) => {
        task.members.forEach((userId) => {
          if (!userTaskMap[userId]) {
            userTaskMap[userId] = { completed: 0, pending: 0, overdue: 0 };
          }
          if (task.status === "completed") {
            userTaskMap[userId].completed += 1;
          } else if (task.status === "pending") {
            userTaskMap[userId].pending += 1;
          } else if (task.status === "overdue") {
            userTaskMap[userId].overdue += 1;
          }
        });
      });

      // Update user summaries based on the filtered tasks
      const updatedUserSummary: UserSummary[] = filtered.map((user) => ({
        ...user,
        completedTasks: userTaskMap[user._id]?.completed || 0,
        pendingTasks: userTaskMap[user._id]?.pending || 0,
        overdueTasks: userTaskMap[user._id]?.overdue || 0,
      }));

      setFilteredUserSummary(updatedUserSummary);
      return;
    }

    setFilteredUserSummary(filtered);
  }, [userStartDate, userEndDate, selectedUserId, data]);

  // Apply Filters to Clients
  useEffect(() => {
    if (!data) return;

    let filtered = data.clients;

    // Filter by Industry
    if (clientIndustryFilter !== "all") {
      filtered = filtered.filter((client) => client.industry === clientIndustryFilter);
    }

    // Filter by Location
    if (clientLocationFilter !== "all") {
      filtered = filtered.filter((client) => client.location === clientLocationFilter);
    }

    setFilteredClients(filtered);
  }, [clientIndustryFilter, clientLocationFilter, data]);

  // Compute User Summary for Bar Charts
  const userLabels = useMemo(
    () => filteredUserSummary.map((user) => `${user.firstName} ${user.lastName}`),
    [filteredUserSummary]
  );

  const userCompletedTasks = useMemo(
    () => filteredUserSummary.map((user) => user.completedTasks),
    [filteredUserSummary]
  );

  const userPendingTasks = useMemo(
    () => filteredUserSummary.map((user) => user.pendingTasks),
    [filteredUserSummary]
  );

  const userOverdueTasks = useMemo(
    () => filteredUserSummary.map((user) => user.overdueTasks),
    [filteredUserSummary]
  );

  // Recent Tasks (Latest 10)
  const recentTasks = useMemo(() => {
    if (!data) return [];
    // Sort tasks by creation date descending
    const sortedTasks = [...data.recentTasks].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sortedTasks.slice(0, 10); // Get the latest 10 tasks
  }, [data]);

  // Client Industries and Locations for Dropdowns
  const clientIndustries = useMemo(() => {
    if (!data) return ["all"];
    const industries = Array.from(new Set(data.clients.map((client) => client.industry)));
    return ["all", ...industries];
  }, [data]);

  const clientLocations = useMemo(() => {
    if (!data) return ["all"];
    const locations = Array.from(new Set(data.clients.map((client) => client.location)));
    return ["all", ...locations];
  }, [data]);

  // Task Statuses and Priorities
  const taskStatuses = ["all", "completed", "in progress", "to do", "pending", "overdue"];
  const taskPriorities = ["all", "high", "medium", "low"];
  const projectStatuses = ["all", "completed", "in progress", "pending", "overdue"];

  // User Selection Dropdown
  const userOptions = useMemo(() => {
    if (!data || !Array.isArray(data.userSummary)) return [{ label: "All Users", value: "all" }];
    const users = data.userSummary.map((user) => ({
      label: `${user.firstName} ${user.lastName}`,
      value: user._id,
    }));
    return [{ label: "All Users", value: "all" }, ...users];
  }, [data]);

  // Debugging: Log Variables Before Rendering
  useEffect(() => {
    console.log("filteredProjects:", filteredProjects);
    console.log("filteredTasks:", filteredTasks);
    console.log("filteredUserSummary:", filteredUserSummary);
    console.log("recentTasks:", recentTasks);
    console.log("data:", data);
  }, [filteredProjects, filteredTasks, filteredUserSummary, recentTasks, data]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-8 border-b-8 border-blue-500"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-600">
        <p>Something went wrong.</p>
        <p>An unexpected error has occurred. Please try reloading the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Reload
        </button>
      </div>
    );
  }

  // Aggregate Project Statistics after Filters
  const totalFilteredProjects = filteredProjects.reduce((sum, project) => sum + project.count, 0);
  const inProgressFilteredProjects =
    filteredProjects.find((p) => p._id === "in progress")?.count || 0;
  const completedFilteredProjects =
    filteredProjects.find((p) => p._id === "completed")?.count || 0;
  const overdueFilteredProjects =
    filteredProjects.find((p) => p._id === "overdue")?.count || 0;
  const pendingFilteredProjects =
    filteredProjects.find((p) => p._id === "pending")?.count || 0;

  // Aggregate Task Statistics after Filters
  const totalFilteredTasks = filteredTasks.reduce((sum, task) => sum + task.count, 0);
  const completedFilteredTasks =
    filteredTasks.find((t) => t._id === "completed")?.count || 0;
  const inProgressFilteredTasks =
    filteredTasks.find((t) => t._id === "in progress")?.count || 0;
  const toDoFilteredTasks =
    filteredTasks.find((t) => t._id === "to do")?.count || 0;
  const pendingFilteredTasks =
    filteredTasks.find((t) => t._id === "pending")?.count || 0;
  const overdueFilteredTasks =
    filteredTasks.find((t) => t._id === "overdue")?.count || 0; // Ensure this line exists
  const highPriorityTasks =
    filteredTasks.find((t) => t._id === "high")?.count || 0;
  const mediumPriorityTasks =
    filteredTasks.find((t) => t._id === "medium")?.count || 0;
  const lowPriorityTasks =
    filteredTasks.find((t) => t._id === "low")?.count || 0;

  // Client Statistics
  const totalClients = filteredClients.length;
  const ongoingClients = data.clientStatusCounts.ongoingClients;
  const verifiedClients = data.clientStatusCounts.verifiedClients;
  const notInProjectClients = data.clientStatusCounts.notInProjectClients;

  // Budget Summary
  const { totalBudget } = data.budgetSummary;

  return (
    <div className="p-6 lg:p-10 space-y-10 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">Dashboard Overview</h1>

      {/* Projects Section */}
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Project Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            {/* Status Filter */}
            <div className="flex items-center space-x-4">
              <label className="block text-sm font-medium text-gray-700">Status:</label>
              <select
                value={projectStatusFilter}
                onChange={(e) => setProjectStatusFilter(e.target.value)}
                className="mt-1 block w-full sm:w-48 px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {projectStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            <StatCard label="Total Projects" count={totalFilteredProjects} color="bg-blue-100" />
            <StatCard label="Completed Projects" count={completedFilteredProjects} color="bg-green-100" />
            <StatCard label="In Progress Projects" count={inProgressFilteredProjects} color="bg-yellow-100" />
            <StatCard label="Pending Projects" count={pendingFilteredProjects} color="bg-gray-100" />
            <StatCard label="Overdue Projects" count={overdueFilteredProjects} color="bg-red-100" /> {/* Added Overdue Projects */}
          </div>

          {/* Project Status Pie Chart */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Project Status Distribution</h2>
            {filteredProjects.length > 0 ? (
              <div className="flex justify-center">
                <div className="w-full max-w-md h-64">
                  <Pie
                    data={{
                      labels: filteredProjects.map((item) => item._id.charAt(0).toUpperCase() + item._id.slice(1)),
                      datasets: [
                        {
                          data: filteredProjects.map((item) => item.count),
                          backgroundColor: ["#42A5F5", "#66BB6A", "#FF7043", "#FFA726", "#EF5350"], // Added color for 'overdue'
                          borderColor: "#ffffff",
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            boxWidth: 20,
                            padding: 15,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">No project data available for the selected filters.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Task Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            {/* Status Filter */}
            <div className="flex items-center space-x-4">
              <label className="block text-sm font-medium text-gray-700">Status:</label>
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="mt-1 block w-full sm:w-48 px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center space-x-4">
              <label className="block text-sm font-medium text-gray-700">Priority:</label>
              <select
                value={taskPriorityFilter}
                onChange={(e) => setTaskPriorityFilter(e.target.value)}
                className="mt-1 block w-full sm:w-48 px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Range Filters */}
            <div className="flex items-center space-x-4">
              <label className="block text-sm font-medium text-gray-700">Due Date From:</label>
              <DatePicker
                selected={taskDueStartDate}
                onChange={(date: Date | null) => setTaskDueStartDate(date)}
                selectsStart
                startDate={taskDueStartDate}
                endDate={taskDueEndDate}
                isClearable
                placeholderText="Start Date"
                className="mt-1 block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="block text-sm font-medium text-gray-700">Due Date To:</label>
              <DatePicker
                selected={taskDueEndDate}
                onChange={(date: Date | null) => setTaskDueEndDate(date)}
                selectsEnd
                startDate={taskDueStartDate}
                endDate={taskDueEndDate}
                minDate={taskDueStartDate}
                isClearable
                placeholderText="End Date"
                className="mt-1 block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Task Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard label="Total Tasks" count={totalFilteredTasks} color="bg-gray-100" />
            <StatCard label="Completed Tasks" count={completedFilteredTasks} color="bg-green-100" />
            <StatCard label="In Progress Tasks" count={inProgressFilteredTasks} color="bg-yellow-100" />
            <StatCard label="To Do Tasks" count={toDoFilteredTasks} color="bg-purple-100" />
            <StatCard label="Pending Tasks" count={pendingFilteredTasks} color="bg-blue-100" />
            <StatCard label="Overdue Tasks" count={overdueFilteredTasks} color="bg-red-100" /> {/* Added Overdue Tasks */}
            <StatCard label="High Priority" count={highPriorityTasks} color="bg-pink-100" />
            <StatCard label="Medium Priority" count={mediumPriorityTasks} color="bg-purple-100" />
            <StatCard label="Low Priority" count={lowPriorityTasks} color="bg-indigo-100" />
          </div>

          {/* Task Status Bar Chart */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Task Status Overview</h2>
            {filteredTasks.length > 0 ? (
              <div className="flex justify-center">
                <div className="w-full max-w-lg h-64">
                  <Bar
                    data={{
                      labels: filteredTasks.map((item) => item._id.charAt(0).toUpperCase() + item._id.slice(1)),
                      datasets: [
                        {
                          label: "Tasks",
                          data: filteredTasks.map((item) => item.count),
                          backgroundColor: ["#66BB6A", "#42A5F5", "#FF7043", "#FFA726", "#EF5350"], // Added color for 'overdue'
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              return `Tasks: ${context.parsed.y}`;
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 5,
                          },
                        },
                        x: {
                          ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">No task data available for the selected filters.</div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Users Section */}
{/* Users Section */}
<Card>
  <CardHeader>
    <CardTitle>Users</CardTitle>
  </CardHeader>
  <CardContent>
    {/* User Filters */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0">
      {/* Completion Date Range Filters */}
      <div className="flex items-center space-x-2">
        <label className="block text-sm font-medium text-gray-700">Completed From:</label>
        <DatePicker
          selected={userStartDate}
          onChange={(date: Date | null) => setUserStartDate(date)}
          selectsStart
          startDate={userStartDate}
          endDate={userEndDate}
          isClearable
          placeholderText="Start Date"
          className="mt-1 block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div className="flex items-center space-x-2">
        <label className="block text-sm font-medium text-gray-700">Completed To:</label>
        <DatePicker
          selected={userEndDate}
          onChange={(date: Date | null) => setUserEndDate(date)}
          selectsEnd
          startDate={userStartDate}
          endDate={userEndDate}
          minDate={userStartDate}
          isClearable
          placeholderText="End Date"
          className="mt-1 block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* User Selection Filter */}
      <div className="flex items-center space-x-2">
        <label className="block text-sm font-medium text-gray-700">Select User:</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="mt-1 block w-full sm:w-48 px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {userOptions.map((user) => (
            <option key={user.value} value={user.value}>
              {user.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => {
          setUserStartDate(null);
          setUserEndDate(null);
          setSelectedUserId("all");
        }}
        className="mt-4 sm:mt-0 px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-300 transition-colors"
      >
        Clear Filters
      </button>
    </div>

    {/* User Summary Bar Charts */}
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">User Task Overview</h2>
      {filteredUserSummary.length > 0 ? (
        <div className="flex flex-col lg:flex-row justify-center space-y-8 lg:space-y-0 lg:space-x-8">
          {/* Completed Tasks */}
          <div className="w-full lg:w-1/3 h-64">
            <h3 className="text-xl font-medium mb-2">Completed Tasks</h3>
            <Bar
              data={{
                labels: userLabels,
                datasets: [
                  {
                    label: "Completed Tasks",
                    data: userCompletedTasks,
                    backgroundColor: "#66BB6A",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        return `Completed: ${context.parsed.y}`;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 2,
                      precision: 0,
                    },
                  },
                  x: {
                    ticks: {
                      autoSkip: false,
                      maxRotation: 45,
                      minRotation: 45,
                    },
                  },
                },
              }}
            />
          </div>

          {/* Pending Tasks */}
          <div className="w-full lg:w-1/3 h-64">
            <h3 className="text-xl font-medium mb-2">Pending Tasks</h3>
            <Bar
              data={{
                labels: userLabels,
                datasets: [
                  {
                    label: "Pending Tasks",
                    data: userPendingTasks,
                    backgroundColor: "#FFA726",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        return `Pending: ${context.parsed.y}`;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 2,
                      precision: 0,
                    },
                  },
                  x: {
                    ticks: {
                      autoSkip: false,
                      maxRotation: 45,
                      minRotation: 45,
                    },
                  },
                },
              }}
            />
          </div>

          {/* Overdue Tasks */}
          <div className="w-full lg:w-1/3 h-64">
            <h3 className="text-xl font-medium mb-2">Overdue Tasks</h3>
            <Bar
              data={{
                labels: userLabels,
                datasets: [
                  {
                    label: "Overdue Tasks",
                    data: userOverdueTasks,
                    backgroundColor: "#EF5350",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        return `Overdue: ${context.parsed.y}`;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 2,
                      precision: 0,
                    },
                  },
                  x: {
                    ticks: {
                      autoSkip: false,
                      maxRotation: 45,
                      minRotation: 45,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">No user data available for the selected filters.</div>
      )}
    </div>
  </CardContent>
</Card>

{/* <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Task Name</th>
                    <th className="py-2 px-4 border-b">Status</th>
                    <th className="py-2 px-4 border-b">Due Date</th>
                    <th className="py-2 px-4 border-b">Priority</th>
                    <th className="py-2 px-4 border-b">Assigned To</th>
                    <th className="py-2 px-4 border-b">Icon</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((task) => (
                    <tr key={task._id} className="hover:bg-gray-100">
                      <td className="py-2 px-4 border-b">{task.taskName}</td>
                      <td className="py-2 px-4 border-b capitalize">{task.status}</td>
                      <td className="py-2 px-4 border-b">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4 border-b capitalize">{task.priority}</td>
                      <td className="py-2 px-4 border-b">
                        {task.members && task.members.length > 0
                          ? task.members.join(", ")
                          : "None"}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        {getStatusIcon(task.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              No recent tasks available
            </div>
          )}
        </CardContent>
      </Card> */}
    </div>
  );
};

const DashboardPage: React.FC = () => {
  return <DashboardContent />;
};

export default DashboardPage;