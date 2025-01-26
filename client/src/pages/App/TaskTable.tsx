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
import NewTaskModal from "../../pages/App/tasks/NewTaskModal";
import EditTaskModal from "../../pages/App/tasks/EditTaskModal";
import DeleteTask from "../../pages/App/tasks/DeleteTask";
import DeleteTaskConfirmation from "../../pages/App/tasks/DeleteTaskConfirmation";
import Confetti from "react-confetti";
import {
  FaSearch,
  FaTrash,
  FaCheckCircle,
  FaCircle,
  FaEllipsisV,
} from "react-icons/fa";

// ---------- Interfaces ----------
interface Department {
  id: string;
  name: string;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  members?: string[];
  project?: string;
  projectId?: string;
  dueDate?: string;
  startDate?: string;
  priority?: string;
  status?: string;
  departments?: Department[];
}

const TaskTable: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Loading & Error
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Confetti states (for Completed or Deleted)
  const [showCompleteConfetti, setShowCompleteConfetti] = useState<boolean>(false);
  const [showDeleteConfetti, setShowDeleteConfetti] = useState<boolean>(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Single delete
  const [isSingleDeleteOpen, setIsSingleDeleteOpen] = useState<boolean>(false);
  const [singleDeleteTaskId, setSingleDeleteTaskId] = useState<string>("");

  // Bulk selection
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState<boolean>(false);

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  // Overdue jump animation keyframes
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes jumpOverdue {
        0% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
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

  // ------------ Fetch Tasks ------------
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/api/tasks`, {
        params: {
          status: statusFilter || undefined,
          date: dateFilter || undefined,
          page: 1,
          limit: 100,
        },
      });

      if (response.data && Array.isArray(response.data.tasks)) {
        setTasks(response.data.tasks);
      } else {
        setError("Unexpected task data format from server.");
        console.error("Unexpected task data format:", response.data);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to fetch tasks. Please try again."
      );
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter, API_URL]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ---- Mark as Completed ----
  const handleMarkAsCompleted = async (taskId: string) => {
    try {
      await axios.patch(`${API_URL}/api/tasks/${taskId}/complete`, null);

      // Show confetti for "Completed"
      setShowCompleteConfetti(true);
      setTimeout(() => setShowCompleteConfetti(false), 2500);

      // Update local state
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: "completed" } : t))
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to mark task as completed."
      );
      console.error("Error marking task as completed:", err);
    }
  };

  // ---- Single Delete ----
  const openSingleDeleteDialog = (taskId: string) => {
    setSingleDeleteTaskId(taskId);
    setIsSingleDeleteOpen(true);
  };
  const closeSingleDeleteDialog = () => {
    setIsSingleDeleteOpen(false);
    setSingleDeleteTaskId("");
  };
  const handleSingleDeleted = (deletedId: string) => {
    // Show confetti for "Deleted"
    setShowDeleteConfetti(true);
    setTimeout(() => setShowDeleteConfetti(false), 2500);

    setTasks((prev) => prev.filter((t) => t._id !== deletedId));
    setSingleDeleteTaskId("");
    setIsSingleDeleteOpen(false);
    setIsSelectionMode(false);
  };

  // ---- Bulk Delete ----
  const handleDeleteSelectedTasks = () => {
    if (selectedTasks.size === 0) return;
    setIsDeleteConfirmationOpen(true);
  };
  const handleCancelDelete = () => {
    setIsDeleteConfirmationOpen(false);
  };
  const handleTasksDeleted = () => {
    // Show confetti for "Deleted"
    setShowDeleteConfetti(true);
    setTimeout(() => setShowDeleteConfetti(false), 2500);

    fetchTasks();
    setSelectedTasks(new Set());
    setIsSelectionMode(false);
  };

  // ---- Toggle Selection ----
  const toggleSelectMode = () => {
    setIsSelectionMode((prev) => !prev);
    setSelectedTasks(new Set());
  };

  // Cancel selection without deleting
  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedTasks(new Set());
  };

  const toggleSelectTask = (taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // ---- Client-Side Filter (searchTerm) ----
  const filteredTasks = tasks.filter((task) =>
    (task.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ---- Sorting Logic ----
  // Overdue -> In Progress -> Pending -> Completed
  const statusOrder: { [key: string]: number } = {
    overdue: 1,
    "in progress": 2,
    pending: 3,
    completed: 4,
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aStatus = (a.status || "pending").toLowerCase();
    const bStatus = (b.status || "pending").toLowerCase();
    const aOrder = statusOrder[aStatus] || 999;
    const bOrder = statusOrder[bStatus] || 999;

    // Sort by custom status order first
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    // Then by due date ascending
    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return aDue - bDue;
  });

  // ---- Merge Updated Task to Local State (Edit) ----
  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
    );
  };

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px",
        position: "relative",
      }}
    >
      {/* Confetti for Completed or Deleted */}
      {showCompleteConfetti && (
        <Confetti
          style={{ position: "fixed", top: 0, left: 0, zIndex: 9999 }}
          numberOfPieces={200}
          recycle={false}
          width={window.innerWidth}
          height={window.innerHeight}
        />
      )}
      {showDeleteConfetti && (
        <Confetti
          style={{ position: "fixed", top: 0, left: 0, zIndex: 9999 }}
          numberOfPieces={150}
          recycle={false}
          width={window.innerWidth}
          height={window.innerHeight}
          colors={["#f44336", "#e91e63", "#9c27b0"]} // "Delete" colors
        />
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#333" }}>
          Task Management
        </h2>

        <div style={{ display: "flex", gap: "16px" }}>
          {!isSelectionMode && (
            <Button
              onClick={() => setIsModalOpen(true)}
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
              + Add Task
            </Button>
          )}

          {isSelectionMode ? (
            <>
              <Button
                onClick={handleDeleteSelectedTasks}
                style={{
                  backgroundColor: "#d9534f",
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
                onClick={handleCancelSelection}
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
              onClick={toggleSelectMode}
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
              Select Tasks
            </Button>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
          alignItems: "center",
        }}
      >
        {/* Search by Title */}
        <div style={{ flex: "1 1 250px", position: "relative" }}>
          <Input
            type="text"
            placeholder="Search tasks..."
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
            onChange={(e) => setStatusFilter(e.target.value)}
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
            onChange={(e) => setDateFilter(e.target.value)}
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
      </div>

      {/* Tasks List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>
          <p>Loading tasks...</p>
        </div>
      ) : error ? (
        <p style={{ color: "red", textAlign: "center" }}>{error}</p>
      ) : sortedTasks.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666", padding: "40px 0" }}>
          No Tasks Available
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {sortedTasks.map((task) => {
            const {
              _id,
              title,
              project,
              members,
              dueDate,
              startDate,
              status,
              departments,
            } = task;

            // Overdue jump
            const jumpAnimation =
              status?.toLowerCase() === "overdue"
                ? "jumpOverdue 0.7s ease-in-out infinite"
                : "none";

            // Determine border color by status
            let borderColor = "#ccc";
            switch ((status || "").toLowerCase()) {
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

            const isSelected = selectedTasks.has(_id);

            return (
              <Card
                key={_id}
                style={{
                  position: "relative",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  borderRadius: "8px",
                  borderLeft: `4px solid ${borderColor}`,
                  transition: "box-shadow 0.3s ease",
                  cursor: isSelectionMode ? "pointer" : "default",
                  overflow: "hidden",
                  animation: jumpAnimation,
                  outline: isSelected ? "2px solid #006272" : "none",
                  outlineOffset: isSelected ? "2px" : "0",
                }}
                onClick={() => {
                  if (isSelectionMode) {
                    toggleSelectTask(_id);
                  } else {
                    navigate(`/tasks/${_id}`);
                  }
                }}
              >
                <CardContent style={{ padding: "16px" }}>
                  <div style={{ marginBottom: "16px" }}>
                    {/* Selection Checkbox */}
                    {isSelectionMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTask(_id)}
                        style={{
                          position: "absolute",
                          top: "16px",
                          left: "16px",
                          transform: "scale(1.5)",
                        }}
                      />
                    )}

                    {/* Task Title */}
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
                        navigate(`/tasks/${_id}`);
                      }}
                    >
                      {title || "Untitled Task"}
                    </h3>

                    {/* Project */}
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#555",
                        marginTop: "4px",
                      }}
                    >
                      <strong>Project:</strong> {project || "N/A"}
                    </p>

                    {/* Members */}
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#555",
                        marginTop: "4px",
                      }}
                    >
                      <strong>Members:</strong>{" "}
                      {members && members.length > 0 ? members.join(", ") : "None"}
                    </p>

                    {/* Departments */}
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#555",
                        marginTop: "4px",
                      }}
                    >
                      <strong>Departments:</strong>{" "}
                      {departments && departments.length > 0
                        ? departments.map((dep) => dep.name).join(", ")
                        : "None"}
                    </p>

                    {/* Start Date */}
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#555",
                        marginTop: "4px",
                      }}
                    >
                      <strong>Start Date:</strong>{" "}
                      {startDate
                        ? new Date(startDate).toLocaleString()
                        : "Not Started"}
                    </p>
                  </div>

                  {/* Due Date & Status */}
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#555",
                      marginBottom: "16px",
                    }}
                  >
                    <p>
                      <strong>Due Date:</strong>{" "}
                      {dueDate
                        ? new Date(dueDate).toLocaleString()
                        : "No due date"}
                    </p>
                    <p
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <strong>Status:</strong>
                      <FaCircle
                        style={{
                          color: borderColor,
                          fontSize: "8px",
                        }}
                      />
                      {status
                        ? status.charAt(0).toUpperCase() + status.slice(1)
                        : "Pending"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "16px",
                    }}
                  >
                    {/* Mark as Completed */}
                    {(status || "").toLowerCase() !== "completed" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsCompleted(_id);
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

                    {/* 3-dot menu */}
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
                            e.stopPropagation();
                            setSelectedTask(task);
                            setIsEditModalOpen(true);
                          }}
                          style={{
                            padding: "8px 12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openSingleDeleteDialog(_id);
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

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={fetchTasks}
      />

      {/* Edit Task Modal */}
      {selectedTask && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          task={selectedTask}
          onTaskUpdated={(updated) => handleTaskUpdated(updated)}
        />
      )}

      {/* Single Delete Task */}
      <DeleteTask
        isOpen={isSingleDeleteOpen}
        onClose={closeSingleDeleteDialog}
        taskId={singleDeleteTaskId}
        onDeleted={handleSingleDeleted}
      />

      {/* Bulk Delete Tasks */}
      <DeleteTaskConfirmation
        isOpen={isDeleteConfirmationOpen}
        onClose={handleCancelDelete}
        taskIds={Array.from(selectedTasks)}
        onTasksDeleted={handleTasksDeleted}
      />
    </div>
  );
};

export default TaskTable;
