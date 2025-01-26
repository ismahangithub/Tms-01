import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../../components/ui/dialog";
import axios from "axios";
import toast from "react-hot-toast";
import Select from "react-select";

interface Option {
  value: string;
  label: string;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

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
  client: Client;
  members: User[];
  department: Department[];
  startDate: string;
  dueDate: string;
  status: string;
  progress: string;
  projectBudget: number;
  priority: string;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [name, setName] = useState<string>("");
  const [client, setClient] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<Option[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Option[]>([]);
  const [budget, setBudget] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectAllUsers, setSelectAllUsers] = useState<boolean>(false);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clientsResponse, usersResponse, departmentsResponse] =
          await Promise.all([
            axios.get<Client[]>("/api/clients"),
            axios.get<{ users: User[] }>("/api/users"),
            axios.get<Department[]>("/api/departments"),
          ]);

        setClients(clientsResponse.data || []);
        const fetchedUsers: User[] = usersResponse.data.users || [];
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
        setDepartments(departmentsResponse.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

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

  useEffect(() => {
    if (selectAllUsers) {
      const allUserOptions = filteredUsers.map((user) => ({
        value: user._id,
        label: `${user.firstName} ${user.lastName}${user.email ? ` (${user.email})` : ""}`,
      }));
      setSelectedUsers(allUserOptions);
    } else {
      setSelectedUsers([]);
    }
  }, [selectAllUsers, filteredUsers]);

  const resetForm = () => {
    setName("");
    setClient("");
    setSelectedDepartments([]);
    setSelectedUsers([]);
    setBudget("");
    setStartDate("");
    setDueDate("");
    setErrors({});
    setSelectAllUsers(false);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = "Project name is required.";
    if (!client) newErrors.client = "Client is required.";
    if (selectedDepartments.length === 0) {
      newErrors.department = "At least one department is required.";
    }
    if (!startDate) newErrors.startDate = "Start date is required.";
    if (!dueDate) newErrors.dueDate = "Due date is required.";
    if (new Date(startDate) > new Date(dueDate)) {
      newErrors.dates = "Start date cannot be after due date.";
    }
    if (!budget || isNaN(Number(budget))) {
      newErrors.budget = "Valid budget amount is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateProject = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token"); // Get the token from localStorage
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      // Decode the token to extract user information (e.g., userId)
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      const userId = decodedToken._id; // Extract userId from token

      const formData = {
        name,
        client,
        department: selectedDepartments.map((d) => d.value),
        projectBudget: Number(budget),
        members: selectedUsers.map((user) => user.value),
        startDate,
        dueDate,
        userId, // Include the userId in the form data
      };

      const response = await axios.post<{ message: string; project: Project }>(
        "/api/projects",
        formData
      );
      console.log("Create Project Response:", response.data);

      const createdProject = response.data.project;
      onProjectCreated(createdProject);

      toast.success("Project created successfully.");
      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error(
        error.response?.data?.message || "Failed to create project. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#006272]">
            Create New Project
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Fill in the project details to create a new project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`border w-full p-2 rounded-md ${errors.name ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Client
            </label>
            <select
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className={`border w-full p-2 rounded-md ${errors.client ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">-- Select Client --</option>
              {clients.map((cli) => (
                <option key={cli._id} value={cli._id}>
                  {cli.name}
                </option>
              ))}
            </select>
            {errors.client && <p className="text-red-500 text-sm">{errors.client}</p>}
          </div>

          {/* Department Selection (Multiple or Single) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Department(s)</label>
            <Select
              isMulti
              options={departments.map((dept) => ({
                value: dept._id,
                label: dept.name,
              }))}
              value={selectedDepartments}
              onChange={(vals) => setSelectedDepartments(vals as Option[])}
              className={`${errors.department ? "border border-red-500 rounded-md" : ""}`}
              placeholder="Select Department(s)"
            />
            {errors.department && <p className="text-red-500 text-sm">{errors.department}</p>}
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Budget ($)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={`border w-full p-2 rounded-md ${errors.budget ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter budget amount"
            />
            {errors.budget && <p className="text-red-500 text-sm">{errors.budget}</p>}
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Assign Users</label>
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
                  label: `${user.firstName} ${user.lastName}${user.email ? ` (${user.email})` : ""}`,
                }))}
                value={selectedUsers}
                onChange={(vals) => setSelectedUsers(vals as Option[])}
                placeholder="Invite Users"
              />
            )}
            {selectAllUsers && <p className="text-gray-700 text-sm">All filtered users have been selected.</p>}
          </div>

          {/* Start and Due Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`border w-full p-2 rounded-md ${errors.startDate ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`border w-full p-2 rounded-md ${errors.dueDate ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.dueDate && <p className="text-red-500 text-sm">{errors.dueDate}</p>}
              {errors.dates && <p className="text-red-500 text-sm">{errors.dates}</p>}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <button
            onClick={handleCreateProject}
            className={`px-4 py-2 rounded-md ${loading ? "bg-gray-400" : "bg-[#006272] text-white"}`}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="bg-gray-300 px-4 py-2 rounded-md"
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
