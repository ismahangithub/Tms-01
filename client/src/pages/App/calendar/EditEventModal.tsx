// src/components/calendar/EditEventModal.tsx

import { FaSpinner } from "react-icons/fa";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../components/ui/dialog";
import Select from "react-select";
import toast from "react-hot-toast";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Department {
  _id: string;
  name: string;
}

interface EditEventModalProps {
  isOpen: boolean;
  event: {
    id: string;
    title: string;
    start: string;
    end?: string;
    color: string;
    description?: string;
    type: "Meeting" | "Project" | "Task" | "Event";
  };
  onClose: () => void;
  onEventUpdated: () => void;
  onEventDeleted: () => void;
}

const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  event,
  onClose,
  onEventUpdated,
  onEventDeleted,
}) => {
  const [title, setTitle] = useState<string>(event.title);
  const [description, setDescription] = useState<string>(event.description || "");
  const [agenda, setAgenda] = useState<string>(
    event.type === "Meeting" ? event.description || "" : ""
  );
  const [date, setDate] = useState<string>(event.start.split("T")[0]);
  const [startTime, setStartTime] = useState<string>(
    event.start.split("T")[1]?.substring(0, 5) || ""
  );
  const [endTime, setEndTime] = useState<string>(
    event.end ? event.end.split("T")[1]?.substring(0, 5) : ""
  );
  const [color, setColor] = useState<string>(event.color);
  const [type, setType] = useState<"Meeting" | "Project" | "Task" | "Event">(
    event.type
  );

  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<{ value: string; label: string }[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch projects or tasks based on type
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (type === "Project") {
          const response = await axios.get("/api/projects");
          setProjects(Array.isArray(response.data?.projects) ? response.data.projects : []);
        } else if (type === "Task") {
          const response = await axios.get("/api/tasks");
          setTasks(Array.isArray(response.data?.tasks) ? response.data.tasks : []);
        }
      } catch (err: any) {
        console.error("Error fetching data for Edit Event:", err);
        toast.error(
          err.response?.data?.message ||
            "Failed to fetch data. Please try again later."
        );
      }
    };
    fetchData();
  }, [type]);

  // When modal opens, fetch users/departments if type=Meeting
  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersResponse, departmentsResponse] = await Promise.all([
          axios.get("/api/users"),
          axios.get("/api/departments"),
        ]);

        const usersData = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        const departmentsData = Array.isArray(departmentsResponse.data) ? departmentsResponse.data : [];

        setUsers(usersData);
        setDepartments(departmentsData);
      } catch (error) {
        toast.error("Error fetching data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (type === "Meeting" && !agenda.trim()) {
      newErrors.agenda = "Agenda is required.";
    }
    if (!description.trim()) newErrors.description = "Description is required.";
    if (!date) newErrors.date = "Date is required.";
    if (!startTime) newErrors.startTime = "Start time is required.";
    if (!endTime) newErrors.endTime = "End time is required.";
    if (new Date(`${date}T${endTime}`) <= new Date(`${date}T${startTime}`)) {
      newErrors.time = "End time must be after start time.";
    }
    if (type === "Meeting" && selectedDepartments.length === 0) {
      newErrors.departments = "At least one department is required.";
    }
    if (type === "Meeting" && selectedUsers.length === 0) {
      newErrors.users = "At least one user is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the validation errors.");
      return;
    }

    try {
      setLoading(true);
      let payload: any = {
        title,
        description,
        date,
        startTime,
        endTime,
        color,
        type,
      };

      if (type === "Meeting") {
        payload.agenda = agenda;
        payload.departments = selectedDepartments.map((d) => d.value);
        payload.invitedUsers = selectedUsers.map((u) => u.value);
      } else if (type === "Project") {
        payload.projectId = title;
      } else if (type === "Task") {
        payload.taskId = title;
      }

      let updateUrl = "";
      if (type === "Meeting") {
        updateUrl = `/api/meetings/${event.id}`;
      } else if (type === "Project") {
        updateUrl = `/api/projects/${event.id}`;
      } else if (type === "Task") {
        updateUrl = `/api/tasks/${event.id}`;
      } else if (type === "Event") {
        updateUrl = `/api/events/${event.id}`;
      }

      await axios.put(updateUrl, payload);

      onEventUpdated();
      toast.success("Event updated successfully.");
      onClose();
    } catch (err: any) {
      console.error("Error updating event:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to update event. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      let deleteUrl = "";

      if (type === "Meeting") {
        deleteUrl = `/api/meetings/${event.id}`;
      } else if (type === "Project") {
        deleteUrl = `/api/projects/${event.id}`;
      } else if (type === "Task") {
        deleteUrl = `/api/tasks/${event.id}`;
      } else if (type === "Event") {
        deleteUrl = `/api/events/${event.id}`;
      }

      await axios.delete(deleteUrl);
      onEventDeleted();
      toast.success("Event deleted successfully!");
      onClose();
    } catch (err: any) {
      console.error("Error deleting event:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to delete event. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle(event.title);
    setDescription(event.description || "");
    setAgenda(event.type === "Meeting" ? event.description || "" : "");
    setDate(event.start.split("T")[0]);
    setStartTime(event.start.split("T")[1]?.substring(0, 5) || "");
    setEndTime(event.end ? event.end.split("T")[1]?.substring(0, 5) : "");
    setColor(event.color);
    setType(event.type);
    setSelectedDepartments([]);
    setSelectedUsers([]);
    setErrors({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#006272]">
            Edit Event
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Update the details of the event below.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <FaSpinner className="animate-spin text-2xl text-[#006272]" />
            <span className="ml-2 text-[#006272]">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Event Type */}
            <div>
              <label className="block text-gray-700">Event Type</label>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "Meeting" | "Project" | "Task" | "Event")
                }
                className="w-full mt-1 p-2 border rounded"
                required
              >
                <option value="Meeting">Meeting</option>
                <option value="Project">Project</option>
                <option value="Task">Task</option>
                <option value="Event">Event</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-gray-700">Title</label>
              {type === "Project" ? (
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 p-2 border rounded"
                  required
                >
                  <option value="">Select Project</option>
                  {Array.isArray(projects) &&
                    projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                </select>
              ) : type === "Task" ? (
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 p-2 border rounded"
                  required
                >
                  <option value="">Select Task</option>
                  {Array.isArray(tasks) &&
                    tasks.map((task) => (
                      <option key={task._id} value={task._id}>
                        {task.title}
                      </option>
                    ))}
                </select>
              ) : type === "Event" ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                  required
                  placeholder="Enter Event Title"
                />
              ) : (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                  required
                  placeholder="Enter Meeting Title"
                />
              )}
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`border w-full p-2 rounded-md ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm">{errors.description}</p>
              )}
            </div>

            {/* Agenda (Only for Meetings) */}
            {type === "Meeting" && (
              <div>
                <label className="block text-gray-700">Agenda</label>
                <textarea
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className={`border w-full p-2 rounded-md ${
                    errors.agenda ? "border-red-500" : "border-gray-300"
                  }`}
                  rows={3}
                  placeholder="Enter meeting agenda"
                ></textarea>
                {errors.agenda && (
                  <p className="text-red-500 text-sm">{errors.agenda}</p>
                )}
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-gray-700">Event Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`border w-full p-2 rounded-md ${
                  errors.date ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.date && (
                <p className="text-red-500 text-sm">{errors.date}</p>
              )}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-gray-700">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`border w-full p-2 rounded-md ${
                  errors.startTime ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.startTime && (
                <p className="text-red-500 text-sm">{errors.startTime}</p>
              )}
            </div>

            {/* End Time */}
            <div>
              <label className="block text-gray-700">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`border w-full p-2 rounded-md ${
                  errors.endTime ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.endTime && (
                <p className="text-red-500 text-sm">{errors.endTime}</p>
              )}
            </div>

            {/* Color */}
            <div>
              <label className="block text-gray-700">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full mt-1 p-2 border rounded"
              />
            </div>

            {/* Departments (Only for Meetings) */}
            {type === "Meeting" && (
              <div>
                <label className="block text-gray-700">Select Departments</label>
                <Select
                  isMulti
                  options={Array.isArray(departments) ? departments.map((dept) => ({
                    value: dept._id,
                    label: dept.name,
                  })) : []}
                  value={selectedDepartments}
                  onChange={(selectedOptions) =>
                    setSelectedDepartments(selectedOptions || [])
                  }
                  className={`mt-1 ${
                    errors.departments ? "border border-red-500" : ""
                  }`}
                  placeholder="Select Departments"
                />
                {errors.departments && (
                  <p className="text-red-500 text-sm">{errors.departments}</p>
                )}
              </div>
            )}

            {/* Users (Only for Meetings) */}
            {type === "Meeting" && (
              <div>
                <label className="block text-gray-700">Invite Users</label>
                <Select
                  isMulti
                  options={Array.isArray(users) ? users.map((user) => ({
                    value: user._id,
                    label: `${user.firstName} ${user.lastName} (${user.email})`,
                  })) : []}
                  value={selectedUsers}
                  onChange={(selectedOptions) =>
                    setSelectedUsers(selectedOptions || [])
                  }
                  className={`mt-1 ${errors.users ? "border border-red-500" : ""}`}
                  placeholder="Select Users"
                />
                {errors.users && (
                  <p className="text-red-500 text-sm">{errors.users}</p>
                )}
              </div>
            )}

            {/* Footer */}
            <DialogFooter className="mt-4 flex justify-between">
              {/* Delete Button */}
              {event.id && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
                >
                  Delete
                </button>
              )}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${
                    loading
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-[#006272] hover:bg-[#00515c]"
                  } text-white font-semibold py-2 px-4 rounded`}
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditEventModal;
