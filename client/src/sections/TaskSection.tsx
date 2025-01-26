// src/sections/TaskSection.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, Tooltip, Legend, CategoryScale, LinearScale } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import StatCard from "../components/StatCard";
import Spinner from "../components/Spinner";

ChartJS.register(BarElement, Tooltip, Legend, CategoryScale, LinearScale);

interface TaskSummary {
  _id: string;
  count: number;
}

interface DashboardData {
  taskSummary: TaskSummary[];
}

const TaskSection: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        const response = await axios.get("http://localhost:8001/api/dashboard"); // Update the endpoint as needed
        const taskData: TaskSummary[] = response.data.taskSummary || [];
        setData({ taskSummary: taskData });
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching task data:", error);
        setIsError(true);
        setIsLoading(false);
      }
    };

    fetchTaskData();
  }, []);

  if (isLoading) return <Spinner />;
  if (isError || !data)
    return (
      <div className="flex flex-col justify-center items-center text-red-600">
        <p>Failed to load task data.</p>
      </div>
    );

  // Calculations
  const totalTasks = data.taskSummary.reduce((sum, task) => sum + task.count, 0);
  const completedTasks = data.taskSummary.find((t) => t._id === "completed")?.count || 0;
  const inProgressTasks = data.taskSummary.find((t) => t._id === "in progress")?.count || 0;
  const pendingTasks = data.taskSummary.find((t) => t._id === "pending")?.count || 0;
  const overdueTasks = data.taskSummary.find((t) => t._id === "overdue")?.count || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <StatCard label="Total Tasks" count={totalTasks} color="bg-gray-100" />
          <StatCard label="Completed" count={completedTasks} color="bg-green-100" />
          <StatCard label="In Progress" count={inProgressTasks} color="bg-yellow-100" />
          <StatCard label="Pending" count={pendingTasks} color="bg-blue-100" />
          <StatCard label="Overdue" count={overdueTasks} color="bg-red-100" />
        </div>

        {/* Task Status Bar Chart */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Task Status Overview</h2>
          {data.taskSummary.length > 0 ? (
            <div className="flex justify-center">
              <div className="w-full max-w-lg">
                <Bar
                  data={{
                    labels: data.taskSummary.map((item) => item._id),
                    datasets: [
                      {
                        label: "Tasks",
                        data: data.taskSummary.map((item) => item.count),
                        backgroundColor: ["#66BB6A", "#42A5F5", "#FF7043", "#FFA726"],
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
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 5,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">No task data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskSection;
