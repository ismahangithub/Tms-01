// src/pages/App/tasks/DeleteTask.tsx

import React from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface DeleteTaskProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  onDeleted: (deletedId: string) => void;
}

const DeleteTask: React.FC<DeleteTaskProps> = ({
  isOpen,
  onClose,
  taskId,
  onDeleted,
}) => {
  if (!isOpen) return null;

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/tasks/${taskId}`);
      toast.success("Task deleted successfully.");
      onDeleted(taskId);
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast.error(error.response?.data?.message || "Failed to delete task.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
        <p>Are you sure you want to delete this task?</p>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
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

export default DeleteTask;
