// src/sections/ProjectSection.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import StatCard from "../components/StatCard";
import Spinner from "../components/Spinner";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

interface ProjectSummary {
  _id: string;
  count: number;
}

interface BudgetSummary {
  totalBudget: number;
  completedBudget: number;
}

interface DashboardData {
  projectSummary: ProjectSummary[];
  budgetSummary: BudgetSummary;
}

const ProjectSection: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await axios.get("http://localhost:8001/api/dashboard"); // Update the endpoint as needed
        const projectData: ProjectSummary[] = response.data.projectSummary || [];
        const budgetData: BudgetSummary = response.data.budgetSummary || {
          totalBudget: 0,
          completedBudget: 0,
        };
        setData({ projectSummary: projectData, budgetSummary: budgetData });
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching project data:", error);
        setIsError(true);
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, []);

  if (isLoading) return <Spinner />;
  if (isError || !data)
    return (
      <div className="flex flex-col justify-center items-center text-red-600">
        <p>Failed to load project data.</p>
      </div>
    );

  // Calculations
  const totalProjects = data.projectSummary.reduce((sum, project) => sum + project.count, 0);
  const completedProjects = data.projectSummary.find((p) => p._id === "completed")?.count || 0;
  const inProgressProjects = data.projectSummary.find((p) => p._id === "in progress")?.count || 0;
  const pendingProjects = data.projectSummary.find((p) => p._id === "pending")?.count || 0;
  const overdueProjects = data.projectSummary.find((p) => p._id === "overdue")?.count || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Projects" count={totalProjects} color="bg-blue-100" />
          <StatCard label="Completed" count={completedProjects} color="bg-green-100" />
          <StatCard label="In Progress" count={inProgressProjects} color="bg-yellow-100" />
          <StatCard label="Pending" count={pendingProjects} color="bg-gray-100" />
          <StatCard label="Overdue" count={overdueProjects} color="bg-red-100" />
          <StatCard
            label="Budget Used"
            count={`$${data.budgetSummary.completedBudget.toLocaleString()}`}
            color="bg-purple-100"
          />
          <StatCard
            label="Total Budget"
            count={`$${data.budgetSummary.totalBudget.toLocaleString()}`}
            color="bg-indigo-100"
          />
        </div>

        {/* Project Status Pie Chart */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Project Status Distribution</h2>
          {data.projectSummary.length > 0 ? (
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <Pie
                  data={{
                    labels: data.projectSummary.map((item) => item._id),
                    datasets: [
                      {
                        data: data.projectSummary.map((item) => item.count),
                        backgroundColor: ["#42A5F5", "#66BB6A", "#FF7043", "#FFA726"],
                        borderColor: "#ffffff",
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
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
            <div className="text-center text-gray-500">No project data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectSection;
