// src/components/calendar/CreateEventModal.tsx

import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../components/ui/dialog";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [color, setColor] = useState<string>("#FFD700");
  const [type, setType] = useState<string>("Event");  // <-- default to "Event"
  const [notifyAdmins, setNotifyAdmins] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) newErrors.title = "Title is required.";
    if (!description.trim()) newErrors.description = "Description is required.";
    if (!date) newErrors.date = "Date is required.";
    if (!startTime) newErrors.startTime = "Start time is required.";
    if (!endTime) newErrors.endTime = "End time is required.";
    if (!type) newErrors.type = "Event type is required.";  // <--

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    if (end <= start) {
      newErrors.time = "End time must be after start time.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create Event
  const handleCreateEvent = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const eventData = {
        title,
        description,
        date,
        startTime,
        endTime,
        color,
        type,           // <-- pass type
        notifyAdmins,
      };

      console.log("Event data being sent:", eventData);

      const response = await axios.post("/api/events", eventData);

      if (response.status === 201) {
        toast.success("Event created successfully.");
        onEventCreated();
        resetForm();
        onClose();
      }
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(error.response?.data?.message || "Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setColor("#FFD700");
    setType("Event");
    setNotifyAdmins(false);
    setErrors({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>Fill in the event details below.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center">
            <FaSpinner className="animate-spin text-2xl text-[#FFD700]" />
            <span className="ml-2 text-[#FFD700]">Loading...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Event Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`border w-full p-2 rounded-md ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
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

            {/* Event Type (could be hidden, or a dropdown) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Event Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`border w-full p-2 rounded-md ${
                  errors.type ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="Event">Event</option>
                <option value="Holiday">Holiday</option>
                <option value="Other">Other</option>
              </select>
              {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
            </div>

            {/* Date / Time */}
            <div className="flex flex-wrap gap-4">
              {/* Date */}
              <div className="flex-1 min-w-[120px]">
                <label className="block text-sm font-medium text-gray-700">
                  Event Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`border w-full p-2 rounded-md ${
                    errors.date ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
              </div>

              {/* Start Time */}
              <div className="flex-1 min-w-[100px]">
                <label className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
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
              <div className="flex-1 min-w-[100px]">
                <label className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
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
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Event Color
              </label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full mt-1 p-2 border rounded"
              />
            </div>

            {/* Notify Admins */}
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={notifyAdmins}
                  onChange={() => setNotifyAdmins(!notifyAdmins)}
                  className="form-checkbox"
                />
                <span className="ml-2">Notify only admins</span>
              </label>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateEvent}
            className={`${
              loading
                ? "bg-yellow-300 cursor-not-allowed"
                : "bg-[#FFD700] hover:bg-[#FFC700]"
            } text-white font-semibold py-2 px-4 rounded`}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Event"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;
