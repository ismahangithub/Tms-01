import React, { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../components/ui/dialog";
import Select from "react-select";
import toast from "react-hot-toast";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: { _id: string };
}

interface Department {
  _id: string;
  name: string;
}

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingCreated: () => void;
}

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onMeetingCreated,
}) => {
  // Form Fields
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [agenda, setAgenda] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  // Data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<
    { value: string; label: string }[]
  >([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<
    { value: string; label: string }[]
  >([]);

  // States
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch Users and Departments when Modal Opens
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetchingData(true);
        const [usersResponse, departmentsResponse] = await Promise.all([
          axios.get("/api/users"),
          axios.get("/api/departments"),
        ]);

        const usersData: User[] = Array.isArray(usersResponse.data)
          ? usersResponse.data
          : [];
        const departmentsData: Department[] = Array.isArray(
          departmentsResponse.data
        )
          ? departmentsResponse.data
          : [];

        setUsers(usersData);
        setDepartments(departmentsData);
      } catch (error) {
        toast.error("Error fetching data.");
      } finally {
        setIsFetchingData(false);
      }
    };

    if (isOpen) {
      fetchData();
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Fetch Users based on selected Departments
  useEffect(() => {
    const fetchUsersByDepartments = async () => {
      try {
        if (selectedDepartments.length > 0) {
          const departmentIds = selectedDepartments.map((dept) => dept.value);
          console.log("Fetching users for departments:", departmentIds);
          const response = await axios.get("/api/users", {
            params: { departments: departmentIds },
          });

          if (Array.isArray(response.data.users)) {
            const filteredUsers = response.data.users.filter((user: User) =>
              departmentIds.includes(user.department?._id)
            );
            setUsers(filteredUsers);
          } else {
            setUsers([]);
          }
        } else {
          // If no departments selected, fetch all users
          const response = await axios.get("/api/users");
          const usersData: User[] = Array.isArray(response.data)
            ? response.data
            : [];
          setUsers(usersData);
        }
      } catch (error) {
        toast.error("Error fetching users based on selected departments.");
      }
    };

    fetchUsersByDepartments();
  }, [selectedDepartments]);

  // Form Validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (!description.trim())
      newErrors.description = "Description is required.";
    if (!agenda.trim()) newErrors.agenda = "Agenda is required.";
    if (!date) newErrors.date = "Date is required.";
    if (!startTime) newErrors.startTime = "Start time is required.";
    if (!endTime) newErrors.endTime = "End time is required.";
    if (
      new Date(`${date}T${endTime}`) <=
      new Date(`${date}T${startTime}`)
    ) {
      newErrors.time = "End time must be after start time.";
    }
    if (selectedDepartments.length === 0) {
      newErrors.departments = "At least one department is required.";
    }
    if (selectedUsers.length === 0) {
      newErrors.users = "At least one user is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Create Meeting
  const handleCreateMeeting = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const meetingData = {
        title,
        description,
        agenda,
        date,
        startTime,
        endTime,
        departments: selectedDepartments.map((d) => d.value),
        invitedUsers: selectedUsers.map((u) => u.value),
      };

      await axios.post("/api/meetings", meetingData);
      toast.success("Meeting created successfully.");
      onMeetingCreated();
      resetForm();
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create meeting."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAgenda("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setSelectedDepartments([]);
    setSelectedUsers([]);
    setErrors({});
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#006272]">
            Create New Meeting
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Fill in the details below to create a meeting.
          </DialogDescription>
        </DialogHeader>

        {/* Loading State for Data Fetching */}
        {isFetchingData ? (
          <div className="flex justify-center items-center h-32">
            <FaSpinner className="animate-spin text-2xl text-[#006272]" />
            <span className="ml-2 text-[#006272]">Loading...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Meeting Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`border w-full p-2 rounded-md ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title}</p>
              )}
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
                <p className="text-red-500 text-sm">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Agenda */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Agenda
              </label>
              <textarea
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                className={`border w-full p-2 rounded-md ${
                  errors.agenda ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.agenda && (
                <p className="text-red-500 text-sm">{errors.agenda}</p>
              )}
            </div>

            {/* Date and Time Fields Side by Side */}
            <div className="flex flex-wrap gap-4">
              {/* Date */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700">
                  Meeting Date
                </label>
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
              <div className="flex-1 min-w-[150px]">
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
                  <p className="text-red-500 text-sm">
                    {errors.startTime}
                  </p>
                )}
              </div>

              {/* End Time */}
              <div className="flex-1 min-w-[150px]">
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
                  <p className="text-red-500 text-sm">
                    {errors.endTime}
                  </p>
                )}
              </div>
            </div>

            {/* Time Validation Error */}
            {errors.time && (
              <div>
                <p className="text-red-500 text-sm">{errors.time}</p>
              </div>
            )}

            {/* Departments */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Departments
              </label>
              <Select
                isMulti
                options={departments.map((dept) => ({
                  value: dept._id,
                  label: dept.name,
                }))}
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
                <p className="text-red-500 text-sm">
                  {errors.departments}
                </p>
              )}
            </div>

            {/* Users */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Invite Users
              </label>
              <Select
                isMulti
                options={users.map((user) => ({
                  value: user._id,
                  label: `${user.firstName} ${user.lastName} (${user.email})`,
                }))}
                value={selectedUsers}
                onChange={(selectedOptions) =>
                  setSelectedUsers(selectedOptions || [])
                }
                className={`mt-1 ${
                  errors.users ? "border border-red-500" : ""
                }`}
                placeholder="Select Users"
              />
              {errors.users && (
                <p className="text-red-500 text-sm">{errors.users}</p>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
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
            onClick={handleCreateMeeting}
            className={`${
              isSubmitting
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-[#006272] hover:bg-[#00515c]"
            } text-white font-semibold py-2 px-4 rounded`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Meeting"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMeetingModal;
