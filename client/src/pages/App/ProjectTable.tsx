import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

import CreateProjectModal from "./projects/CreateProject";
import EditProjectModal from "./projects/EditProject";
import DeleteProject from "./projects/DeleteProject";
import DeleteProjectConfirmation from "./projects/DeleteProjectConfirmation";

import toast from "react-hot-toast";
import Confetti from "react-confetti";

import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaCircle,
  FaEllipsisV,
  FaDollarSign,
} from "react-icons/fa";

interface Client {
  _id: string;
  name: string;
}

interface Department {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Project {
  _id: string;
  name: string;
  client?: Client | Client[] | null;
  department?: Department;
  members?: User[];
  startDate?: string;
  dueDate?: string;
  status?: string;
  progress?: string;
  projectBudget?: number;
  priority?: string;
  totalTasks?: number;
  completedTasks?: number;
}

interface ProjectsResponse {
  projects: Project[];
  pagination: {
    total: number;
    currentPage: number;
    totalPages: number;
  };
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

const ProjectTable: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  const [allDepartments, setAllDepartments] = useState<Department[]>([]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [isSingleDeleteOpen, setIsSingleDeleteOpen] = useState<boolean>(false);
  const [singleDeleteProjectId, setSingleDeleteProjectId] = useState<string>("");

  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes jump {
        0%   { transform: translateY(0); }
        50%  { transform: translateY(-10px); }
        100% { transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    return () => setShowConfetti(false);
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("User not authenticated.");
        return;
      }

      const resp = await axios.get<Department[]>(`${API_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllDepartments(resp.data);
    } catch (err) {
      console.error("Error fetching departments:", err);
      toast.error("Failed to fetch departments.");
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("User is not authenticated.");
        setLoading(false);
        navigate("/auth/login");
        return;
      }

      const resp = await axios.get<ProjectsResponse>(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: statusFilter || undefined,
          department: departmentFilter || undefined,
          date: dateFilter || undefined,
          page,
          limit: 10,
        },
      });

      if (resp.data && Array.isArray(resp.data.projects)) {
        setProjects(resp.data.projects);
        if (resp.data.pagination) {
          setPage(resp.data.pagination.currentPage);
          setTotalPages(resp.data.pagination.totalPages);
        }
      } else {
        console.error("Expected {projects, pagination}, got:", resp.data);
        setProjects([]);
        setError("Unexpected server response format.");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.response?.data?.message || "Unable to fetch projects.");
      toast.error(err.response?.data?.message || "Unable to fetch projects.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, departmentFilter, dateFilter, navigate]);

  useEffect(() => {
    fetchDepartments();
    fetchProjects();
  }, [fetchDepartments, fetchProjects]);

  const filteredProjects = projects.filter((p) =>
    (p.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusOrder: { [key: string]: number } = {
    overdue: 1,
    "in progress": 2,
    pending: 3,
    completed: 4,
  };

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const aStatus = (a.status || "pending").toLowerCase();
    const bStatus = (b.status || "pending").toLowerCase();
    const aOrder = statusOrder[aStatus] || 999;
    const bOrder = statusOrder[bStatus] || 999;

    if (aOrder !== bOrder) return aOrder - bOrder;

    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return aDue - bDue;
  });

  const handleEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p._id === updatedProject._id ? updatedProject : p))
    );
    setIsEditModalOpen(false);
    toast.success("Project updated successfully.");
  };

  const openSingleDeleteDialog = (projectId: string) => {
    setSingleDeleteProjectId(projectId);
    setIsSingleDeleteOpen(true);
  };
  const closeSingleDeleteDialog = () => {
    setIsSingleDeleteOpen(false);
    setSingleDeleteProjectId("");
  };
  const handleSingleDeleted = () => {
    setProjects((prev) => prev.filter((p) => p._id !== singleDeleteProjectId));
    setSingleDeleteProjectId("");
    setIsSingleDeleteOpen(false);
    setIsSelectionMode(false);
    toast.success("Project deleted successfully.");
  };

  const handleDeleteSelectedProjects = () => {
    if (selectedProjects.size === 0) {
      toast.error("No projects selected for deletion.");
      return;
    }
    setIsDeleteConfirmationOpen(true);
  };
  const handleProjectsDeleted = () => {
    fetchProjects();
    setSelectedProjects(new Set());
    setIsSelectionMode(false);
    toast.success("Selected projects deleted successfully.");
  };
  const handleCancelDelete = () => {
    setIsDeleteConfirmationOpen(false);
  };

  const handleCompleteProject = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("User is not authenticated.");
        navigate("/auth/login");
        return;
      }

      await axios.put(
        `${API_URL}/api/projects/${id}`,
        { status: "completed" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Project marked as completed");

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete project.");
      toast.error(err.response?.data?.message || "Failed to complete project.");
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev);
    setSelectedProjects(new Set());
  };

  const toggleSelectProject = (id: string) => {
    setSelectedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getClientName = (client?: Client | Client[] | null) => {
    if (Array.isArray(client)) {
      return client.length ? client[0].name : "N/A";
    } else if (client) {
      return client.name || "N/A";
    }
    return "N/A";
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px", position: "relative" }}>
      {showConfetti && (
        <Confetti
          style={{ position: "fixed", top: 0, left: 0, zIndex: 9999 }}
          numberOfPieces={250}
          recycle={false}
          width={window.innerWidth}
          height={window.innerHeight}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#333" }}>Project Management</h2>
        <div style={{ display: "flex", gap: "16px" }}>
          {!isSelectionMode && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                backgroundColor: "#006272",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              <FaCheckCircle />
              Add Project
            </Button>
          )}
          {isSelectionMode ? (
            <>
              <Button
                onClick={handleDeleteSelectedProjects}
                style={{
                  backgroundColor: "#e03e3e",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                <FaTrash />
                Delete Selected
              </Button>
              <Button
                onClick={() => setIsSelectionMode(false)}
                style={{
                  backgroundColor: "#555",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                Cancel Selection
              </Button>
            </>
          ) : (
            <Button
              onClick={toggleSelectionMode}
              style={{
                backgroundColor: "#E03E3E",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              <FaTrash />
              Select Projects
            </Button>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "24px", alignItems: "center" }}>
        {/* Search (by project name) */}
        <div style={{ flex: "1 1 250px", position: "relative" }}>
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "8px 8px 8px 32px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              width: "100%",
              fontSize: "14px",
            }}
          />
          <FaSearch
            style={{
              position: "absolute",
              top: "50%",
              left: "8px",
              transform: "translateY(-50%)",
              color: "#888",
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
          <label style={{ marginBottom: "4px", fontWeight: 500 }}>Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            style={{
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            <option value="">All Statuses</option>
            <option value="overdue">Overdue</option>
            <option value="in progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Due Date Filter */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
          <label style={{ marginBottom: "4px", fontWeight: 500 }}>Due Date Filter</label>
          <select
            value={dateFilter}
            onChange={(e) => {
              setPage(1);
              setDateFilter(e.target.value);
            }}
            style={{
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            <option value="">All Dates</option>
            <option value="today">Due Today</option>
            <option value="week">Due This Week</option>
            <option value="month">Due This Month</option>
          </select>
        </div>

        {/* Department Filter */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
          <label style={{ marginBottom: "4px", fontWeight: 500 }}>Department Filter</label>
          <select
            value={departmentFilter}
            onChange={(e) => {
              setPage(1);
              setDepartmentFilter(e.target.value);
            }}
            style={{
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            <option value="">All Departments</option>
            {allDepartments.map((dep) => (
              <option key={dep._id} value={dep._id}>
                {dep.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>
          <p>Loading projects...</p>
        </div>
      ) : error ? (
        <p style={{ color: "red", textAlign: "center" }}>{error}</p>
      ) : sortedProjects.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666", padding: "40px 0" }}>
          No Projects Available
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {sortedProjects.map((proj) => {
            if (!proj || !proj._id) return null;

            const cardKey = `project-${proj._id}`;
            const deptArray = Array.isArray(proj.department) ? proj.department : [];
            const memArray = Array.isArray(proj.members) ? proj.members : [];

            const totalTasks = proj.totalTasks || 0;
            const completedTasks = proj.completedTasks || 0;
            const openTasks = totalTasks - completedTasks;

            // Border color based on status
            let borderColor = "#ccc";
            switch ((proj.status || "").toLowerCase()) {
              case "completed":
                borderColor = "green";
                break;
              case "in progress":
                borderColor = "#FBC62D";
                break;
              case "overdue":
                borderColor = "red";
                break;
              default:
                borderColor = "#ccc";
            }

            // Overdue bounce animation
            const jumpAnimation =
              (proj.status || "").toLowerCase() === "overdue"
                ? "jump 0.6s ease-in-out infinite"
                : "none";

            return (
              <Card
                key={cardKey}
                style={{
                  position: "relative",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  borderRadius: "8px",
                  borderLeft: `4px solid ${borderColor}`,
                  animation: jumpAnimation,
                  cursor: isSelectionMode ? "pointer" : "default",
                  overflow: "hidden",
                  outline:
                    isSelectionMode && selectedProjects.has(proj._id)
                      ? "2px solid #006272"
                      : "none",
                  outlineOffset: isSelectionMode ? "2px" : "0",
                }}
                onClick={() => {
                  if (isSelectionMode) {
                    toggleSelectProject(proj._id);
                  } else {
                    navigate(`/projects/${proj._id}`);
                  }
                }}
              >
                <CardContent style={{ padding: "16px" }}>
                  <div style={{ marginBottom: "16px" }}>
                    {isSelectionMode && (
                      <input
                        type="checkbox"
                        checked={selectedProjects.has(proj._id)}
                        onChange={() => toggleSelectProject(proj._id)}
                        style={{
                          position: "absolute",
                          top: "16px",
                          left: "16px",
                          transform: "scale(1.5)",
                        }}
                      />
                    )}
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#006272",
                        cursor: "pointer",
                        margin: 0,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${proj._id}`);
                      }}
                    >
                      {proj.name || "Unnamed Project"}
                    </h3>
                    {/* Client (single or array) */}
                    <p style={{ fontSize: "14px", color: "#555", marginTop: "4px" }}>
                      <strong>Client:</strong>{" "}
                      {Array.isArray(proj.client) && proj.client.length > 0
                        ? proj.client[0].name
                        : !Array.isArray(proj.client) && proj.client?.name
                        ? proj.client.name
                        : "N/A"}
                    </p>
                    {/* Departments */}
                    <p style={{ fontSize: "14px", color: "#555", marginTop: "4px" }}>
                      <strong>Department(s):</strong>{" "}
                      {deptArray.length
                        ? deptArray.map((d) => d.name).join(", ")
                        : "N/A"}
                    </p>
                    {/* Members */}
                    <p style={{ fontSize: "14px", color: "#555", marginTop: "4px" }}>
                      <strong>Members:</strong>{" "}
                      {memArray.length
                        ? memArray
                            .map((m) => `${m.firstName} ${m.lastName}`)
                            .join(", ")
                        : "No members assigned"}
                    </p>
                    {/* Budget */}
                    <p style={{ fontSize: "14px", color: "#555", marginTop: "4px" }}>
                      <strong>
                        <FaDollarSign /> Budget:
                      </strong>{" "}
                      {proj.projectBudget ? `$${proj.projectBudget}` : "N/A"}
                    </p>
                  </div>

                  {/* Due & Status */}
                  <div
                    style={{ fontSize: "14px", color: "#555", marginBottom: "16px" }}
                  >
                    <p>
                      <strong>Due Date:</strong>{" "}
                      {proj.dueDate
                        ? new Date(proj.dueDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <strong>Status:</strong>
                      {proj.status && (
                        <FaCircle style={{ color: borderColor, fontSize: "8px" }} />
                      )}
                      {proj.status || "N/A"}
                    </p>
                  </div>

                  {/* Task info */}
                  {!totalTasks ? (
                    <p style={{ fontSize: "12px", color: "#777" }}>
                      No tasks assigned
                    </p>
                  ) : (
                    <>
                      <p style={{ fontSize: "14px", color: "#555" }}>
                        <strong>{openTasks}</strong> open task
                        {openTasks !== 1 ? "s" : ""}
                        <span style={{ marginLeft: "8px" }}>
                          (Total: {totalTasks})
                        </span>
                      </p>
                      <div
                        style={{
                          backgroundColor: "#e0e0e0",
                          width: "100%",
                          height: "8px",
                          borderRadius: "4px",
                          marginTop: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: `${(
                              (completedTasks / totalTasks) *
                              100
                            ).toFixed(2)}%`,
                            backgroundColor:
                              (proj.status || "").toLowerCase() === "overdue"
                                ? "red"
                                : (proj.status || "").toLowerCase() === "completed"
                                ? "green"
                                : "#006272",
                            height: "100%",
                            borderRadius: "4px",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#777",
                          marginTop: "4px",
                        }}
                      >
                        Completed: {completedTasks} / {totalTasks}
                      </p>
                    </>
                  )}

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "16px",
                    }}
                  >
                    {(proj.status || "").toLowerCase() !== "completed" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteProject(proj._id);
                        }}
                        style={{
                          backgroundColor: "#4CAF50",
                          color: "#fff",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <FaCheckCircle />
                        Complete
                      </button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        style={{
                          padding: "4px 8px",
                          borderRadius: "50%",
                          backgroundColor: "#f0f0f0",
                          cursor: "pointer",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaEllipsisV />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        style={{
                          backgroundColor: "#fff",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          minWidth: "120px",
                          zIndex: 999,
                        }}
                      >
                        <DropdownMenuItem
                          onClick={(e) => {
                            handleEditProject(proj, e);
                          }}
                          style={{
                            padding: "8px 12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                          }}
                        >
                          <FaEdit style={{ color: "#555" }} />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openSingleDeleteDialog(proj._id);
                          }}
                          style={{
                            padding: "8px 12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                          }}
                        >
                          <FaTrash style={{ color: "red" }} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          style={{
            marginTop: "24px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page <= 1}
            style={{
              backgroundColor: "#999",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: "6px",
              cursor: page <= 1 ? "not-allowed" : "pointer",
            }}
          >
            Previous
          </Button>
          <span style={{ fontSize: "16px" }}>
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page >= totalPages}
            style={{
              backgroundColor: "#999",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: "6px",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={(newProject) => {
          if (newProject && typeof newProject._id === "string") {
            setProjects((prev) => [newProject, ...prev]);
            toast.success("Project created successfully");
          } else {
            console.error("New project is missing _id:", newProject);
            toast.error("Failed to add the new project.");
          }
          setIsCreateModalOpen(false);
        }}
      />

      {/* Edit Project Modal */}
      {selectedProject && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          project={selectedProject}
          onProjectUpdated={handleProjectUpdated}
        />
      )}

      {/* Single Delete Project Modal */}
      <DeleteProject
        isOpen={isSingleDeleteOpen}
        onClose={closeSingleDeleteDialog}
        projectId={singleDeleteProjectId}
        onDeleted={handleSingleDeleted}
      />

      {/* Bulk Delete Confirmation */}
      <DeleteProjectConfirmation
        isOpen={isDeleteConfirmationOpen}
        onClose={handleCancelDelete}
        projectIds={Array.from(selectedProjects)}
        onProjectsDeleted={handleProjectsDeleted}
      />
    </div>
  );
};

export default ProjectTable;
