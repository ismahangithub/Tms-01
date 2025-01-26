// src/pages/DashboardPage.tsx

import React from "react";
import ErrorBoundary from "../components/ErrorBoundary";
import ProjectSection from "../sections/ProjectSection";
import TaskSection from "../sections/TaskSection";
import ClientSection from "../sections/ClientSection";
import UserSection from "../sections/UserSection";

const DashboardPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="p-6 lg:p-10 space-y-10 bg-gray-50 min-h-screen">
        <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">
          Dashboard Overview
        </h1>

        <ProjectSection />
        <TaskSection />
        <ClientSection />
        <UserSection />
      </div>
    </ErrorBoundary>
  );
};

export default DashboardPage;
