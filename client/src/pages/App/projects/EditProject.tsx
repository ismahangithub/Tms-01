// src/pages/App/projects/EditProjectModal.tsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../components/ui/dialog";
import axios from "axios";
import toast from "react-hot-toast";
import { FaCheckCircle } from "react-icons/fa";
import Select, { MultiValue, ActionMeta } from "react-select";

// ----- Interfaces -----
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  department?: {
    _id: string;
    name: string;
  };
}

interface Client {
  _id: string;
  name: string;
}

interface Department {
  _id: string;
  name: string;
}

interface Project {
  _id: string;
  name: string;
  client: Client | null;
  members: User[];
  department: Department[];
  startDate: string;
  dueDate: string;
  status: string;
  progress: number;
  projectBudget: number;
  priority: string;
}

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null; // project can be null
  onProjectUpdated: (updatedProject: Project) => void;
}

interface Option {
  value: string;
  label: string;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
}) => {
  const [name, setName] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // For the form fields
  const [selectedClient, setSelectedClient] = useState<Option | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<MultiValue<Option>>([]);
  const [selectedMembers, setSelectedMembers] = useState<MultiValue<Option>>([]);
  const [selectAllUsers, setSelectAllUsers] = useState<boolean>(false);

  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("pending");
  const [progress, setProgress] = useState(0);

  // New: projectBudget + priority
  const [projectBudget, setProjectBudget] = useState<number>(0);
  const [priority, setPriority] = useState<string>("medium");

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ----- Load Clients, Users, Departments when modal is opened -----
  useEffect(() => {
    const fetchClientsUsersAndDepartments = async () => {
      setDataLoading(true);
      try {
        const [clientResponse, userResponse, departmentResponse] = await Promise.all([
          axios.get("/api/clients"),
          axios.get("/api/users"),
          axios.get("/api/departments"),
        ]);

        // 1) Clients
        setClients(Array.isArray(clientResponse.data) ? clientResponse.data : []);

        // 2) Users
        if (Array.isArray(userResponse.data)) {
          // Some endpoints return an array directly
          setUsers(userResponse.data);
        } else if (userResponse.data.users && Array.isArray(userResponse.data.users)) {
          // Some endpoints return { users: [...] }
          setUsers(userResponse.data.users);
        } else {
          console.error("Unexpected format for users data:", userResponse.data);
          setUsers([]);
          setFetchError("Failed to load users.");
        }

        // 3) Departments
        if (Array.isArray(departmentResponse.data)) {
          setDepartments(departmentResponse.data);
        } else {
          console.error("Expected departments data to be an array.");
          setDepartments([]);
        }
      } catch (error) {
        console.error("Error fetching clients, users, or departments:", error);
        setClients([]);
        setUsers([]);
        setDepartments([]);
        setFetchError("Failed to load clients, users, or departments.");
      } finally {
        setDataLoading(false);
      }
    };

    if (isOpen) {
      fetchClientsUsersAndDepartments();
    }
  }, [isOpen]);

  // ----- Populate fields when `project` changes -----
  useEffect(() => {
    if (project) {
      setName(project.name || "");

      // Client
      if (project.client) {
        setSelectedClient({
          value: project.client._id,
          label: project.client.name,
        });
      } else {
        setSelectedClient(null);
      }

      // Departments
      const deptOptions = (project.department || []).map((dept) => ({
        value: dept._id,
        label: dept.name,
      }));
      setSelectedDepartments(deptOptions);

      // Members
      const memberOptions = (project.members || []).map((member) => ({
        value: member._id,
        label: `${member.firstName} ${member.lastName}${member.email ? ` (${member.email})` : ""}`,
      }));
      setSelectedMembers(memberOptions);

      setStartDate(project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "");
      setDueDate(project.dueDate ? new Date(project.dueDate).toISOString().split("T")[0] : "");
      setStatus(project.status || "pending");
      setProgress(project.progress || 0);

      // New: Budget + Priority
      setProjectBudget(project.projectBudget ?? 0);
      setPriority(project.priority ?? "medium");
    } else {
      // Reset form if no project is selected
      setName("");
      setSelectedClient(null);
      setSelectedDepartments([]);
      setSelectedMembers([]);
      setStartDate("");
      setDueDate("");
      setStatus("pending");
      setProgress(0);
      setProjectBudget(0);
      setPriority("medium");
      setSelectAllUsers(false);
      setErrors({});
    }
  }, [project]);

  // ----- Filter Users based on selected departments -----
  useEffect(() => {
    if (selectedDepartments.length === 0) {
      setFilteredUsers(users);
    } else {
      const selectedDeptIds = selectedDepartments.map((d) => d.value);
      const filtered = users.filter(
        (u) =>
          u.department &&
          u.department._id &&
          selectedDeptIds.includes(u.department._id)
      );
      setFilteredUsers(filtered);
    }
  }, [selectedDepartments, users]);

  // ----- Handle Select All Users -----
  useEffect(() => {
    if (selectAllUsers) {
      const allUserOptions = filteredUsers.map((user) => ({
        value: user._id,
        label: `${user.firstName} ${user.lastName}${user.email ? ` (${user.email})` : ""}`,
      }));
      setSelectedMembers(allUserOptions);
    } else {
      // If unchecking, retain previously selected members that are still in filteredUsers
      setSelectedMembers((prev) =>
        prev.filter((member) => filteredUsers.some((user) => user._id === member.value))
      );
    }
  }, [selectAllUsers, filteredUsers]);

  // ----- Convert DB docs -> <Select> options -----
  const clientOptions: Option[] = clients.map((cli) => ({
    value: cli._id,
    label: cli.name,
  }));
  const departmentOptions: Option[] = departments.map((dept) => ({
    value: dept._id,
    label: dept.name,
  }));
  const userOptions: Option[] = filteredUsers.map((usr) => ({
    value: usr._id,
    label: `${usr.firstName} ${usr.lastName}${usr.email ? ` (${usr.email})` : ""}`,
  }));

  // ----- Handlers for <Select> fields -----
  const handleClientChange = (selected: Option | null) => {
    setSelectedClient(selected);
  };
  const handleDepartmentsChange = (selected: MultiValue<Option>, _actionMeta: ActionMeta<Option>) => {
    setSelectedDepartments(selected);
    setSelectAllUsers(false); // Reset select all when departments change
  };
  const handleMembersChange = (selected: MultiValue<Option>, _actionMeta: ActionMeta<Option>) => {
    setSelectedMembers(selected);
    if (selected.length !== filteredUsers.length) {
      setSelectAllUsers(false);
    }
  };

  // ----- Validate Form -----
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = "Project name is required.";
    if (!selectedClient) newErrors.client = "Client is required.";
    if (selectedDepartments.length === 0) {
      newErrors.departments = "At least one department is required.";
    }
    if (!startDate) newErrors.startDate = "Start date is required.";
    if (!dueDate) newErrors.dueDate = "Due date is required.";
    if (startDate && dueDate && new Date(dueDate) <= new Date(startDate)) {
      newErrors.dueDate = "Due date must be after start date.";
    }
    if (progress < 0 || progress > 100) {
      newErrors.progress = "Progress must be between 0 and 100.";
    }
    if (projectBudget < 0) {
      newErrors.projectBudget = "Budget cannot be negative.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ----- Submit the updated Project -----
  const handleUpdateProject = async () => {
    if (!project) return;

    if (!validateForm()) {
      toast.error("Please fix validation errors.");
      return;
    }

    try {
      setLoading(true);
      // Build the payload
      const payload = {
        name,
        client: selectedClient ? selectedClient.value : null,
        department: selectedDepartments.map((dept) => dept.value),
        members: selectedMembers.map((member) => member.value),
        startDate,
        dueDate,
        status,
        progress,
        projectBudget, // <-- new
        priority,      // <-- new
      };

      const response = await axios.put(`/api/projects/${project._id}`, payload);
      console.log("Update Project Response:", response.data); // Debugging

      const updatedProject = response.data.project;
      onProjectUpdated(updatedProject);
      toast.success("Project updated successfully");
      onClose();
    } catch (error: any) {
      console.error("Update project error:", error);
      const errorMessage =
        error.response?.data?.message || "Error updating project. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ----- UI if data is loading -----
  if (dataLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full flex items-center justify-center"
          style={{ height: "200px" }}
        >
          <p className="text-gray-500">Loading...</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby="edit-project-description"
        className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#006272]">
            Edit Project
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Please update the project information below.
          </DialogDescription>
        </DialogHeader>

        {fetchError && (
          <p className="text-red-500 mb-4">{fetchError}</p>
        )}

        <div className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <input
              className={`border p-2 w-full rounded-md ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project Name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Client</label>
            <Select
              options={clientOptions}
              value={selectedClient}
              onChange={handleClientChange}
              placeholder="Select Client"
              isClearable
              className="mt-1"
            />
            {errors.client && (
              <p className="text-red-500 text-sm">{errors.client}</p>
            )}
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Department(s)</label>
            <Select
              isMulti
              options={departmentOptions}
              value={selectedDepartments}
              onChange={handleDepartmentsChange}
              placeholder="Select Department(s)"
              className="mt-1"
            />
            {errors.departments && (
              <p className="text-red-500 text-sm">{errors.departments}</p>
            )}
          </div>

          {/* Members Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Assign Members</label>
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
                options={userOptions}
                value={selectedMembers}
                onChange={handleMembersChange}
                placeholder="Assign Members"
                className="mt-1"
              />
            )}
            {selectAllUsers && (
              <p className="text-gray-700 text-sm">All filtered users have been selected.</p>
            )}
            {selectedMembers.length === 0 && !selectAllUsers && (
              <p className="text-gray-500 text-sm">No members assigned.</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              className={`border p-2 w-full rounded-md ${
                errors.startDate ? "border-red-500" : "border-gray-300"
              }`}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm">{errors.startDate}</p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              className={`border p-2 w-full rounded-md ${
                errors.dueDate ? "border-red-500" : "border-gray-300"
              }`}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {errors.dueDate && (
              <p className="text-red-500 text-sm">{errors.dueDate}</p>
            )}
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              className="border p-2 w-full rounded-md border-gray-300"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Progress */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Progress (%)</label>
            <input
              className={`border p-2 w-full rounded-md ${
                errors.progress ? "border-red-500" : "border-gray-300"
              }`}
              type="number"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              placeholder="Progress %"
            />
            {errors.progress && (
              <p className="text-red-500 text-sm">{errors.progress}</p>
            )}
          </div>

          {/* Project Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Project Budget ($)
            </label>
            <input
              type="number"
              className={`border p-2 w-full rounded-md ${
                errors.projectBudget ? "border-red-500" : "border-gray-300"
              }`}
              value={projectBudget}
              onChange={(e) => setProjectBudget(Number(e.target.value))}
              placeholder="Enter budget amount"
            />
            {errors.projectBudget && (
              <p className="text-red-500 text-sm">{errors.projectBudget}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              className="border p-2 w-full rounded-md border-gray-300"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <DialogFooter className="mt-4 flex justify-end space-x-2">
          <button
            onClick={handleUpdateProject}
            className={`bg-[#006272] hover:bg-[#004956] text-white px-4 py-2 rounded-md flex items-center gap-2 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Updating..." : (
              <>
                <FaCheckCircle />
                Update
              </>
            )}
          </button>
          <button
            onClick={() => {
              onClose();
            }}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
            disabled={loading}
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectModal;
