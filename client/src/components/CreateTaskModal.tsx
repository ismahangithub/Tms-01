// src/components/CreateTaskModal.tsx

import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { FaTimes } from "react-icons/fa";
import { Button } from "../pages/App/components/ui/button";
import axios from "axios";
import toast from "react-hot-toast";

interface AssignedMember {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onTaskCreated: (task: Task) => void;
}

interface Task {
  _id: string;
  title: string;
  status: string;
  dueDate: string;
  assignedMembers: AssignedMember[];
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onTaskCreated,
}) => {
  const [title, setTitle] = useState<string>("");
  const [status, setStatus] = useState<string>("pending");
  const [dueDate, setDueDate] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      // Reset form
      setTitle("");
      setStatus("pending");
      setDueDate("");
      setAssignedTo([]);
    }
    // eslint-disable-next-line
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get<User[]>("/api/users");
      if (Array.isArray(response.data)) {
        setAllUsers(response.data);
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      toast.error("Failed to load users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await axios.post<Task>("/api/tasks", {
        title,
        status,
        dueDate,
        project: projectId,
        assignedTo,
      });
      onTaskCreated(response.data);
      onClose();
    } catch (err: any) {
      console.error("Error creating task:", err);
      toast.error(err.response?.data?.message || "Failed to create task.");
    } finally {
      setCreating(false);
    }
  };

  const handleCheckboxChange = (userId: string) => {
    setAssignedTo((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Create Task"
      ariaHideApp={false}
      className="max-w-lg mx-auto mt-20 bg-white p-6 rounded shadow-lg outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Create New Task</h2>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
          <FaTimes size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700">
            Task Title
          </label>
          <input
            type="text"
            id="taskTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="taskStatus" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="taskStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="pending">Pending</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label htmlFor="taskDueDate" className="block text-sm font-medium text-gray-700">
            Due Date
          </label>
          <input
            type="date"
            id="taskDueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Assign To
          </label>
          {loadingUsers ? (
            <div className="flex items-center space-x-2">
              <FaSpinner className="animate-spin text-gray-500" />
              <span className="text-gray-500">Loading users...</span>
            </div>
          ) : (
            <div className="mt-1 space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
              {allUsers.map((user) => (
                <div key={user._id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`assign-${user._id}`}
                    checked={assignedTo.includes(user._id)}
                    onChange={() => handleCheckboxChange(user._id)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor={`assign-${user._id}`} className="ml-2 block text-sm text-gray-700">
                    {user.firstName} {user.lastName} {user.email && `(${user.email})`}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={creating}
            className={`px-4 py-2 rounded-md text-white ${
              creating ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {creating ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
