// Import dependencies
import React from "react";
import axios from "axios";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

interface DeleteReportConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  reportId?: string | null;
  reportIds?: string[];
  multiple: boolean;
  onReportDeleted: () => void;
}

const DeleteReportConfirmation: React.FC<DeleteReportConfirmationProps> = ({
  isOpen,
  onClose,
  reportId,
  reportIds,
  multiple,
  onReportDeleted,
}) => {
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required. Redirecting to login...");
        window.location.href = "/auth/login";
        return;
      }

      if (multiple && reportIds) {
        // Bulk delete
        await axios.delete("/api/reports/delete", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { reportIds },
        });
        toast.success("Selected reports deleted successfully!");
      } else if (reportId) {
        // Single delete
        await axios.delete(`/api/reports/${reportId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success("Report deleted successfully!");
      }

      onReportDeleted();
      onClose();
    } catch (error: any) {
      console.error("Error deleting report(s):", error);
      const errorMessage = error.response?.data?.error || "Error deleting report(s).";
      toast.error(errorMessage);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "/auth/login";
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <FontAwesomeIcon icon={faTrash} /> {multiple ? "Delete Reports" : "Delete Report"}
          </DialogTitle>
        </DialogHeader>

        <div className="my-4">
          <p className="text-gray-700">
            {multiple
              ? "Are you sure you want to delete the selected reports? This action cannot be undone."
              : "Are you sure you want to delete this report? This action cannot be undone."}
          </p>
        </div>

        <DialogFooter className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 hover:bg-red-700 flex items-center"
          >
            <FontAwesomeIcon icon={faTrash} className="mr-1" /> Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteReportConfirmation;
