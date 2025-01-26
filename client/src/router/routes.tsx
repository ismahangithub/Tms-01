// src/routes/index.tsx or src/routes/routes.tsx

import React, { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import AuthenticatedRoute from '../components/Auth-routes';

// Lazy-loaded components
const Index = lazy(() => import('../pages/Index'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const UsersTable = lazy(() => import('../pages/App/UserTable'));
const Clients = lazy(() => import('../pages/App/ClientTable'));
const Departments = lazy(() => import('../pages/App/Departments'));
const Projects = lazy(() => import('../pages/App/ProjectTable'));
const CalendarPage = lazy(() => import('../pages/App/Calendar'));
const CreateMeetingPage = lazy(() => import('../pages/App/CreateMeetingPage'));
const TaskTable = lazy(() => import('../pages/App/TaskTable'));
const Reports = lazy(() => import('../pages/App/ReportTable'));
const ProjectDetails = lazy(() => import('../pages/App/projects/ProjectDetails')); // Ensure correct import
const TaskDetails = lazy(() => import('../pages/App/tasks/TaskDetails')); // Updated
const CreateReport = lazy(() => import('../pages/App/report/CreateReport'));
const ContactTable = lazy(() => import('../pages/App/ContactTable')); // New Contact table route

// Define a fallback component for Suspense
const LoadingFallback: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex justify-center items-center h-screen">
    <p className="text-gray-500">{message}</p>
  </div>
);

// Define routes
const routes = [
  {
    path: '/dashboard',
    element: (
      <AuthenticatedRoute>
        <Suspense fallback={<LoadingFallback message="Loading Dashboard..." />}>
          <Index />
        </Suspense>
      </AuthenticatedRoute>
    ),
    layout: 'default',
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" />,
  },
  {
    path: '/usersList',
    element: (
      <AuthenticatedRoute>
        <Suspense fallback={<LoadingFallback message="Loading Users..." />}>
          <UsersTable />
        </Suspense>
      </AuthenticatedRoute>
    ),
    layout: 'default',
  },
  {
    path: '/auth/login',
    element: (
      <Suspense fallback={<LoadingFallback message="Loading Login..." />}>
        <Login />
      </Suspense>
    ),
    layout: 'blank',
  },
  {
    path: '/auth/register',
    element: (
      <Suspense fallback={<LoadingFallback message="Loading Registration..." />}>
        <Register />
      </Suspense>
    ),
    layout: 'blank',
  },
  {
    path: '/clients',
    element: (
      <AuthenticatedRoute>
        <Suspense fallback={<LoadingFallback message="Loading Clients..." />}>
          <Clients />
        </Suspense>
      </AuthenticatedRoute>
    ),
    layout: 'default',
  },
  {
    path: '/departments',
    element: (
      <AuthenticatedRoute>
        <Suspense fallback={<LoadingFallback message="Loading Departments..." />}>
          <Departments />
        </Suspense>
      </AuthenticatedRoute>
    ),
    layout: 'default',
  },
  {
    path: '/projects',
    element: (
      <AuthenticatedRoute>
        <Suspense fallback={<LoadingFallback message="Loading Projects..." />}>
          <Projects />
        </Suspense>
      </AuthenticatedRoute>
    ),
    layout: 'default',
  },
  {
    path: '/projects/:projectId',
    element: (
      <AuthenticatedRoute>
        <Suspense fallback={<LoadingFallback message="Loading Project Details..." />}>
          <ProjectDetails />
        </Suspense>
      </AuthenticatedRoute>
    ),
    layout: 'default',
  },
  {
    path: '/tasks/:taskId',
    element: (
      <AuthenticatedRoute>
        <Suspense fallback={<LoadingFallback message="Loading Task Details..." />}>
          <TaskDetails />
        </Suspense>
      </AuthenticatedRoute>
    ),
    layout: 'default',
  },
  {
    path: '/apps/calendar',
    element: (
      <AuthenticatedRoute>
        <Suspense fallback={<LoadingFallback message="Loading Calendar..." />}>
          <CalendarPage />
        </Suspense>
      </AuthenticatedRoute>
    ),
    layout: 'default',
  },
  {
    path: '/apps/tasks',
    element: (
      <AuthenticatedRoute>
        <Suspense fallback={<LoadingFallback message="Loading Tasks..." />}>
          <TaskTable />
        </Suspense>
      </AuthenticatedRoute>
    ),
    layout: 'default',
  },
  {
    path: '/apps/reports',
    element: (
      <AuthenticatedRoute>
        <Suspense fallback={<LoadingFallback message="Loading Reports..." />}>
          <Reports />
        </Suspense>
      </AuthenticatedRoute>
    ),
    layout: 'default',
  },
  {
    path: '/reports/create',
    element: (
      <AuthenticatedRoute>
        <Suspense fallback={<LoadingFallback message="Loading Create Report..." />}>
          <CreateReport />
        </Suspense>
      </AuthenticatedRoute>
    ),
    layout: 'default',
  },
  {
    path: '/apps/create-meeting',
    element: (
      <AuthenticatedRoute>
        <Suspense fallback={<LoadingFallback message="Loading Create Meeting..." />}>
          <CreateMeetingPage />
        </Suspense>
      </AuthenticatedRoute>
    ),
    layout: 'default',
  },
  {
    path: '/apps/contacts',
    element: (
      <AuthenticatedRoute>
        <Suspense fallback={<LoadingFallback message="Loading Contacts..." />}>
          <ContactTable />
        </Suspense>
      </AuthenticatedRoute>
    ),
    layout: 'default',
  },
];

export { routes };
