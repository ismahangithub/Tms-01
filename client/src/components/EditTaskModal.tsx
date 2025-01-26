// src/components/EditTaskModal.tsx

import React, { useState, useEffect } from "react";
import { Modal, TextInput, Button, Select } from "@mantine/core";
import { Task } from "../types"; // Adjust based on your Task type location

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onTaskUpdated: (updatedTask: Task) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onTaskUpdated,
}) => {
  const [title, setTitle] = useState<string>(task?.title || "");
  const [status, setStatus] = useState<string>(task?.status || "");
  const [dueDate, setDueDate] = useState<string>(task?.dueDate || "");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setStatus(task.status);
      setDueDate(task.dueDate);
    }
  }, [task]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Task title cannot be empty.");
      return;
    }

    if (!dueDate) {
      toast.error("Due date is required.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      const updatedTask = {
        ...task,
        title,
        status,
        dueDate,
      };

      const response = await axios.patch(
        `/api/tasks/${task?._id}`,
        updatedTask,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      onTaskUpdated(response.data.task);
      onClose();
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error(error.response?.data?.message || "Failed to update task.");
    }
  };

  return (
    <Modal opened={isOpen} onClose={onClose} title="Edit Task">
      <TextInput
        label="Task Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Select
        label="Task Status"
        value={status}
        onChange={(value) => setStatus(value || "")}
        data={[
          { value: "pending", label: "Pending" },
          { value: "in progress", label: "In Progress" },
          { value: "completed", label: "Completed" },
          { value: "overdue", label: "Overdue" },
        ]}
        required
      />
      <TextInput
        label="Due Date"
        type="date"
        value={dueDate ? dueDate.split('T')[0] : ""}
        onChange={(e) => setDueDate(e.target.value)}
        required
      />
      <Button onClick={handleSave} className="mt-4" fullWidth>
        Save
      </Button>
    </Modal>
  );
};

export default EditTaskModal;
