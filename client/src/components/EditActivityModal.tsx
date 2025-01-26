// src/components/EditActivityModal.tsx

import React, { useState } from "react";
// import Modal from "./ui/Modal"; // Assuming you have a Modal component
import { Button } from "./ui/Button";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

/** -----------------------------
 *  Type Definitions
 * ----------------------------- */

/** Represents an Activity */
interface Activity {
  _id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

/** Props for EditActivityModal */
interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
  onActivityUpdated: (updatedActivity: Activity) => void;
}

const EditActivityModal: React.FC<EditActivityModalProps> = ({
  isOpen,
  onClose,
  activity,
  onActivityUpdated,
}) => {
  const [details, setDetails] = useState<string>(activity.details || "");
  const [loading, setLoading] = useState<boolean>(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  const handleUpdate = async () => {
    if (!details.trim()) {
      toast.error("Details cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.patch(
        `${API_URL}/api/activities/${activity._id}`,
        { details },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data && response.data.activity) {
        onActivityUpdated(response.data.activity);
        toast.success("Activity updated successfully.");
        onClose();
      } else {
        toast.error("Unexpected response from server.");
      }
    } catch (err: any) {
      console.error("Error updating activity:", err);
      toast.error(err.response?.data?.message || "Failed to update activity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Edit Activity</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Action
            </label>
            <input
              type="text"
              value={activity.action}
              disabled
              className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Performed By
            </label>
            <input
              type="text"
              value={activity.performedBy}
              disabled
              className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Details
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2"
              rows={4}
            ></textarea>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleUpdate}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditActivityModal;
