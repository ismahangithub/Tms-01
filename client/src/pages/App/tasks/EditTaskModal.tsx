import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../components/ui/dialog";
import Select from "react-select";
import axios from "axios";
import toast from "react-hot-toast";

// ---------------- Types ----------------
interface Department {
  _id: string;
  name: string;
  color?: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: Department;
}

interface Project {
  _id: string;
  name: string;
}

interface TaskDepartment {
  id: string;
  name: string;
  color?: string;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  assignedTo?: User[];
  projectId?: string;
  project?: string;
  startDate?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  departments?: TaskDepartment[];
}

interface Option {
  value: string;
  label: string;
}

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  /**
   * Provide a callback that the parent can use to update the local tasks array
   * or re-fetch tasks. We'll pass the newly updated Task object back to the parent.
   */
  onTaskUpdated: (updatedTask: Task) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onTaskUpdated,
}) => {
  // ---------------- Local Form States ----------------
  const [title, setTitle] = useState<string>(task.title || "");
  const [description, setDescription] = useState<string>(task.description || "");
  const [startDate, setStartDate] = useState<string>(
    task.startDate ? new Date(task.startDate).toISOString().slice(0, 16) : ""
  );
  const [dueDate, setDueDate] = useState<string>(
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ""
  );
  const [priority, setPriority] = useState<string>(task.priority || "medium");
  const [status, setStatus] = useState<string>(task.status || "pending");
  const [project, setProject] = useState<string>(task.projectId || "");

  // Convert the existing `departments` to react-select Options
  const [selectedDepartments, setSelectedDepartments] = useState<Option[]>(
    task.departments
      ? task.departments.map((d) => ({ value: d.id, label: d.name }))
      : []
  );

  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectAllUsers, setSelectAllUsers] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  // ---------------- Effects ----------------
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [deptRes, projRes, userRes] = await Promise.all([
          axios.get<Department[]>(`${API_URL}/api/departments`),
          axios.get<any>(`${API_URL}/api/projects`), // Adjusted to any for flexibility
          axios.get<{ users: User[] }>(`${API_URL}/api/users`),
        ]);

        console.log("Departments:", deptRes.data);
        console.log("Projects:", projRes.data);
        console.log("Users:", userRes.data.users);

        setAvailableDepartments(deptRes.data || []);

        // Adjusting based on the response structure
        const fetchedProjects: Project[] = Array.isArray(projRes.data.projects)
          ? projRes.data.projects
          : Array.isArray(projRes.data)
          ? projRes.data
          : [];

        setProjects(fetchedProjects || []);

        setUsers(userRes.data.users || []);
        setFilteredUsers(userRes.data.users || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch data for editing task.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Initialize assigned users with the ones from `task.assignedTo`
    if (task.assignedTo) {
      const assignedOptions = task.assignedTo.map((u) => ({
        value: u._id,
        label: `${u.firstName} ${u.lastName} (${u.email})`,
      }));
      setSelectedUsers(assignedOptions);
    } else {
      setSelectedUsers([]);
    }
  }, [isOpen, API_URL, task]);

  // Filter users by selected departments
  useEffect(() => {
    if (selectedDepartments.length === 0) {
      setFilteredUsers(users);
    } else {
      const selectedDeptIds = selectedDepartments.map((dep) => dep.value);
      const filtered = users.filter(
        (u) => u.department && selectedDeptIds.includes(u.department._id)
      );
      setFilteredUsers(filtered);
    }
  }, [selectedDepartments, users]);

  // Select all users if requested
  useEffect(() => {
    if (selectAllUsers) {
      const allUserOptions = filteredUsers.map((u) => ({
        value: u._id,
        label: `${u.firstName} ${u.lastName} (${u.email})`,
      }));
      setSelectedUsers(allUserOptions);
    } else {
      // Keep only those who are still in filteredUsers
      const validSelected = selectedUsers.filter((opt) =>
        filteredUsers.some((u) => u._id === opt.value)
      );
      setSelectedUsers(validSelected);
    }
  }, [selectAllUsers, filteredUsers, selectedUsers]);

  // ---------------- Validation ----------------
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = "Task title is required.";
    }
    if (!project) {
      newErrors.project = "Project is required.";
    }
    if (selectedDepartments.length === 0) {
      newErrors.departments = "At least one department is required.";
    }
    if (!dueDate) {
      newErrors.dueDate = "Due date is required.";
    } else if (new Date(dueDate) < new Date()) {
      newErrors.dueDate = "Due date cannot be in the past.";
    }
    if (!priority) {
      newErrors.priority = "Priority is required.";
    }
    if (!status) {
      newErrors.status = "Status is required.";
    }
    if (selectedUsers.length === 0 && !selectAllUsers) {
      newErrors.assignedTo = "At least one user must be assigned.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------- Save Changes ----------------
  const handleSaveChanges = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        title,
        description,
        startDate: startDate || null,
        dueDate,
        priority,
        status,
        project,
        departments: selectedDepartments.map((d) => d.value),
        assignedTo: selectedUsers.map((u) => u.value),
      };

      const response = await axios.put(`${API_URL}/api/tasks/${task._id}`, payload);

      // Check if response is an array or an object
      const updatedTask = Array.isArray(response.data.tasks)
        ? response.data.tasks[0]
        : response.data.tasks;

      toast.success("Task updated successfully!");

      // Pass updatedTask back to parent so it can update local tasks array
      onTaskUpdated(updatedTask);

      onClose();
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error(
        error.response?.data?.message || "Failed to update task. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare the selected project for react-select
  const selectedProject = Array.isArray(projects)
    ? projects.find((p) => p._id === project)
    : null;
  const selectedProjectOption = selectedProject
    ? { value: selectedProject._id, label: selectedProject.name }
    : null;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-white p-6 rounded-lg shadow-lg"
        style={{
          minWidth: "700px",  // Make the modal wider
          maxWidth: "700px",
          maxHeight: "75vh",  // Decrease height
          overflowY: "auto",
        }}
      >
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-[#006272]">
              Edit Task
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-500">
            Update the task details below.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Task Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`mt-1 block w-full border ${errors.title ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm p-2`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title}</p>
              )}
            </div>

            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Project<span className="text-red-500">*</span>
              </label>
              <Select
                options={projects.map((p) => ({
                  value: p._id,
                  label: p.name,
                }))}
                value={selectedProjectOption}
                onChange={(sel) => setProject(sel ? sel.value : "")}
                placeholder="Select a project"
                classNamePrefix="react-select"
                className={`mt-1 ${errors.project ? "border-red-500" : ""}`}
              />
              {errors.project && (
                <p className="text-red-500 text-sm">{errors.project}</p>
              )}
            </div>

            {/* Departments + Due Date row */}
            <div className="flex flex-wrap -mx-2">
              {/* Departments */}
              <div className="w-full md:w-1/2 px-2 mb-4 md:mb-0">
                <label className="block text-sm font-medium text-gray-700">
                  Select Department(s)<span className="text-red-500">*</span>
                </label>
                <Select
                  isMulti
                  options={availableDepartments.map((dept) => ({
                    value: dept._id,
                    label: dept.name,
                  }))}
                  value={selectedDepartments}
                  onChange={(vals) => setSelectedDepartments(vals as Option[])}
                  placeholder="Select department(s)"
                  classNamePrefix="react-select"
                  className={`mt-1 ${errors.departments ? "border-red-500" : ""}`}
                />
                {errors.departments && (
                  <p className="text-red-500 text-sm">{errors.departments}</p>
                )}
              </div>

              {/* Due Date */}
              <div className="w-full md:w-1/2 px-2">
                <label className="block text-sm font-medium text-gray-700">
                  Due Date<span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`mt-1 block w-full border ${errors.dueDate ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm p-2`}
                />
                {errors.dueDate && (
                  <p className="text-red-500 text-sm">{errors.dueDate}</p>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            {/* Assigned Users */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Assign Users<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={selectAllUsers}
                  onChange={() => setSelectAllUsers(!selectAllUsers)}
                />
                <span>Select All Users (Filtered by Department)</span>
              </div>
              {!selectAllUsers && (
                <Select
                  isMulti
                  options={filteredUsers.map((u) => ({
                    value: u._id,
                    label: `${u.firstName} ${u.lastName} (${u.email})`,
                  }))}
                  value={selectedUsers}
                  onChange={(vals) => setSelectedUsers(vals as Option[])}
                  placeholder="Assign users"
                  classNamePrefix="react-select"
                />
              )}
              {selectAllUsers && (
                <p className="text-gray-700 text-sm">
                  All filtered users have been selected.
                </p>
              )}
              {errors.assignedTo && (
                <p className="text-red-500 text-sm">{errors.assignedTo}</p>
              )}
            </div>

            {/* Priority & Status row */}
            <div className="flex flex-wrap -mx-2">
              {/* Priority */}
              <div className="w-full md:w-1/2 px-2 mb-4 md:mb-0">
                <label className="block text-sm font-medium text-gray-700">
                  Priority<span className="text-red-500">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={`mt-1 block w-full border ${
                    errors.priority ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm p-2`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                {errors.priority && (
                  <p className="text-red-500 text-sm">{errors.priority}</p>
                )}
              </div>

              {/* Status */}
              <div className="w-full md:w-1/2 px-2">
                <label className="block text-sm font-medium text-gray-700">
                  Status<span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`mt-1 block w-full border ${
                    errors.status ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm p-2`}
                >
                  <option value="pending">Pending</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
                {errors.status && (
                  <p className="text-red-500 text-sm">{errors.status}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                rows={4}
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <button
            onClick={handleSaveChanges}
            className={`px-4 py-2 rounded-md ${
              isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#006272] text-white"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={() => {
              if (!isSubmitting) {
                onClose();
              }
            }}
            className="bg-red-300 px-4 py-2 rounded-md"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskModal;
