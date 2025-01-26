// src/sections/UserSection.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, Tooltip, Legend, CategoryScale, LinearScale } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import StatCard from "../components/StatCard";
import Spinner from "../components/Spinner";
import FilterPanel from "../components/FilterPanel";

ChartJS.register(BarElement, Tooltip, Legend, CategoryScale, LinearScale);

interface UserSummary {
  _id: string;
  firstName: string;
  lastName: string;
  completedTasks: number;
}

interface DashboardData {
  userSummary: UserSummary[];
  tasks: {
    completedDate?: string; // Ensure tasks have a completedDate
    members: string[];
  }[];
}

const UserSection: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  // Filter States
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Filtered User Summary
  const [filteredUserSummary, setFilteredUserSummary] = useState<UserSummary[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:8001/api/dashboard"); // Update the endpoint as needed
        const userData: UserSummary[] = response.data.userSummary || [];
        const tasksData = response.data.tasks || [];
        setData({ userSummary: userData, tasks: tasksData });
        setFilteredUserSummary(userData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsError(true);
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Filter Logic
  useEffect(() => {
    if (!data) return;

    if (!startDate && !endDate) {
      setFilteredUserSummary(data.userSummary);
      return;
    }

    // Filter tasks based on date range
    const filteredTasks = data.tasks.filter((task) => {
      if (!task.completedDate) return false; // Exclude tasks without a completedDate
      const taskDate = new Date(task.completedDate);
      if (startDate && taskDate < startDate) return false;
      if (endDate && taskDate > endDate) return false;
      return true;
    });

    // Map user IDs to completed tasks count
    const userTaskMap: { [key: string]: number } = {};

    filteredTasks.forEach((task) => {
      const userId = task.members[0]; // Assuming the first member is the assigned user
      if (userTaskMap[userId]) {
        userTaskMap[userId] += 1;
      } else {
        userTaskMap[userId] = 1;
      }
    });

    // Update user summary based on filtered tasks
    const newUserSummary: UserSummary[] = data.userSummary.map((user) => ({
      ...user,
      completedTasks: userTaskMap[user._id] || 0,
    }));

    setFilteredUserSummary(newUserSummary);
  }, [startDate, endDate, data]);

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  if (isLoading) return <Spinner />;
  if (isError || !data)
    return (
      <div className="flex flex-col justify-center items-center text-red-600">
        <p>Failed to load user data.</p>
      </div>
    );

  // User Summary Data for Bar Chart
  const userLabels = filteredUserSummary.map((user) => `${user.firstName} ${user.lastName}`);
  const userTaskData = filteredUserSummary.map((user) => user.completedTasks);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter Panel */}
        <FilterPanel
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          clearFilters={clearFilters}
        />

        {/* User Summary Bar Chart */}
        <div className="mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Completed Tasks per User</h2>
          {filteredUserSummary.length > 0 ? (
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <Bar
                  data={{
                    labels: userLabels,
                    datasets: [
                      {
                        label: "Completed Tasks",
                        data: userTaskData,
                        backgroundColor: "#42A5F5", // Indigo color
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            return `Completed Tasks: ${context.parsed.y}`;
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
            <div className="text-center text-gray-500">No user data available for the selected date range.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSection;
