// src/pages/App/tasks/DeleteTaskConfirmation.tsx

import React from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface DeleteTaskConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  taskIds: string[];
  onTasksDeleted: () => void;
}

const DeleteTaskConfirmation: React.FC<DeleteTaskConfirmationProps> = ({
  isOpen,
  onClose,
  taskIds,
  onTasksDeleted,
}) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  if (!isOpen) return null;

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/tasks`, {
        data: { ids: taskIds }, // The request body for bulk delete
      });
      toast.success("Tasks deleted successfully!");
      onTasksDeleted();
      onClose();
    } catch (error: any) {
      console.error("Error bulk deleting tasks:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to delete tasks. Please try again."
      );
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Delete Tasks</h2>
        <p>Are you sure you want to delete these tasks? This action cannot be undone.</p>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={handleConfirmDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTaskConfirmation;
