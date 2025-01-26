// src/pages/App/tasks/NewTaskModal.tsx

import React, { useState, useEffect } from "react";
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

interface Option {
  value: string;
  label: string;
}

interface Department {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
}

interface Project {
  _id: string;
  name: string;
}

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
}) => {
  // Form state variables
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [status, setStatus] = useState<string>("pending");
  const [project, setProject] = useState<string>("");
  const [selectedDepartments, setSelectedDepartments] = useState<Option[]>([]);
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

  // Fetch departments, projects, and users when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [departmentsRes, projectsRes, usersRes] = await Promise.all([
          axios.get<Department[]>(`${API_URL}/api/departments`),
          axios.get(`${API_URL}/api/projects`),
          axios.get<{ users: User[] }>(`${API_URL}/api/users`),
        ]);

        // Check if projects are wrapped in a property "projects" or not.
        const projectsData = projectsRes.data.projects || projectsRes.data || [];
        setAvailableDepartments(departmentsRes.data || []);
        setProjects(projectsData);
        setUsers(usersRes.data.users || []);
        setFilteredUsers(usersRes.data.users || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch necessary data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, API_URL]);

  // Filter users by selected departments
  useEffect(() => {
    if (selectedDepartments.length === 0) {
      setFilteredUsers(users);
    } else {
      const selectedDeptIds = selectedDepartments.map((dept) => dept.value);
      const filtered = users.filter(
        (user) =>
          user.department && selectedDeptIds.includes(user.department._id)
      );
      setFilteredUsers(filtered);
    }
  }, [selectedDepartments, users]);

  // Handle select-all users
  useEffect(() => {
    if (selectAllUsers) {
      const allUserOptions = filteredUsers.map((user) => ({
        value: user._id,
        label: `${user.firstName} ${user.lastName} (${user.email})`,
      }));
      setSelectedUsers(allUserOptions);
    } else {
      setSelectedUsers([]);
    }
  }, [selectAllUsers, filteredUsers]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDate("");
    setDueDate("");
    setPriority("medium");
    setStatus("pending");
    setProject("");
    setSelectedDepartments([]);
    setSelectedUsers([]);
    setSelectAllUsers(false);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) newErrors.title = "Task title is required.";
    if (!project) newErrors.project = "Project is required.";
    if (selectedDepartments.length === 0) {
      newErrors.departments = "At least one department is required.";
    }
    if (!dueDate) newErrors.dueDate = "Due date is required.";
    if (new Date(dueDate) < new Date()) {
      newErrors.dueDate = "Due date cannot be in the past.";
    }
    if (!priority) newErrors.priority = "Priority is required.";
    if (!status) newErrors.status = "Status is required.";
    if (selectedUsers.length === 0 && !selectAllUsers) {
      newErrors.assignedTo = "At least one user must be assigned.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTask = async () => {
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
        departments: selectedDepartments.map((dept) => dept.value),
        assignedTo: selectedUsers.map((user) => user.value),
      };

      // Send the POST request
      await axios.post(`${API_URL}/api/tasks`, payload);

      // Optimistically update the task table immediately.
      // You may call onTaskCreated() which (for example) triggers a re-fetch in TaskTable.
      toast.success("Task created successfully!");
      onTaskCreated();

      // Reset form and close modal.
      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error(
        error.response?.data?.message || "Failed to create task. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Prepare selected project for react-select
  const selectedProject = projects.find((p) => p._id === project);
  const selectedProjectOption = selectedProject
    ? { value: selectedProject._id, label: selectedProject.name }
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-white p-6 rounded-lg shadow-lg"
        style={{
          minWidth: "700px",
          maxWidth: "700px",
          maxHeight: "75vh",
          overflowY: "auto",
        }}
      >
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-[#006272]">
              Create New Task
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-500">
            Fill in the task details below to create a new task.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <span className="text-gray-500">Loading...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Task Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Task Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`mt-1 block w-full border ${
                  errors.title ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm p-2`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title}</p>
              )}
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Project<span className="text-red-500">*</span>
              </label>
              <Select
                options={projects.map((proj) => ({
                  value: proj._id,
                  label: proj.name,
                }))}
                value={selectedProjectOption}
                onChange={(selected) =>
                  setProject(selected ? selected.value : "")
                }
                placeholder="Select a project"
                classNamePrefix="react-select"
                className={`mt-1 ${errors.project ? "border-red-500" : ""}`}
              />
              {errors.project && (
                <p className="text-red-500 text-sm">{errors.project}</p>
              )}
            </div>

            {/* Departments and Due Date */}
            <div className="flex flex-wrap -mx-2">
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
                  onChange={(vals) =>
                    setSelectedDepartments(vals as Option[])
                  }
                  placeholder="Select department(s)"
                  classNamePrefix="react-select"
                  className={`mt-1 ${
                    errors.departments ? "border-red-500" : ""
                  }`}
                />
                {errors.departments && (
                  <p className="text-red-500 text-sm">
                    {errors.departments}
                  </p>
                )}
              </div>
              <div className="w-full md:w-1/2 px-2">
                <label className="block text-sm font-medium text-gray-700">
                  Due Date<span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`mt-1 block w-full border ${
                    errors.dueDate ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm p-2`}
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

            {/* Assign Users */}
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
                  options={filteredUsers.map((user) => ({
                    value: user._id,
                    label: `${user.firstName} ${user.lastName} (${user.email})`,
                  }))}
                  value={selectedUsers}
                  onChange={(vals) =>
                    setSelectedUsers(vals as Option[])
                  }
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

            {/* Priority & Status */}
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
                placeholder="Enter task description"
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <button
            onClick={handleCreateTask}
            className={`px-4 py-2 rounded-md ${
              isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#006272] text-white"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Task"}
          </button>
          <button
            onClick={() => {
              if (!isSubmitting) {
                onClose();
                resetForm();
              }
            }}
            className="bg-gray-300 px-4 py-2 rounded-md"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewTaskModal;
