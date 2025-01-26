// src/components/calendar/DeleteEventModal.tsx

import React from "react";
import toast from "react-hot-toast";
import axios from "axios";

interface DeleteEventModalProps {
  event: {
    id: string;
    title: string;
    type: "Meeting" | "Project" | "Task" | "Event";
  };
  onClose: () => void;
  onEventDeleted: () => void;
}

const DeleteEventModal: React.FC<DeleteEventModalProps> = ({
  event,
  onClose,
  onEventDeleted,
}) => {
  const handleDelete = async () => {
    try {
      let deleteUrl = "";

      switch (event.type) {
        case "Meeting":
          deleteUrl = `/api/meetings/${event.id}`;
          break;
        case "Project":
          deleteUrl = `/api/projects/${event.id}`;
          break;
        case "Task":
          deleteUrl = `/api/tasks/${event.id}`;
          break;
        case "Event":
          deleteUrl = `/api/events/${event.id}`;
          break;
        default:
          toast.error("Invalid event type.");
          return;
      }

      await axios.delete(deleteUrl);
      toast.success("Event deleted successfully!");
      onEventDeleted();
      onClose();
    } catch (err: any) {
      console.error("Error deleting event:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to delete event. Please try again later."
      );
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Delete Event</h2>
      <p className="mb-6">
        Are you sure you want to delete the event "<strong>{event.title}</strong>"?
      </p>
      <div className="flex justify-end space-x-4">
        <button
          onClick={onClose}
          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default DeleteEventModal;
