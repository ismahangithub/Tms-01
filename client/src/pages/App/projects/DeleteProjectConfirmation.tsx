// src/pages/App/projects/DeleteProjectConfirmation.tsx

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../../components/ui/alert-dialog";
import axios from "axios";
import toast from "react-hot-toast";

interface DeleteProjectConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  projectIds: string[];       // Accept multiple project IDs
  onProjectsDeleted: () => void; // Callback after deletion
}

const DeleteProjectConfirmation: React.FC<DeleteProjectConfirmationProps> = ({
  isOpen,
  onClose,
  projectIds,
  onProjectsDeleted,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDeleteProjects = async () => {
    try {
      setLoading(true);
      console.log("Bulk Deletion - Project IDs:", projectIds);

      // Bulk delete endpoint
      await axios.delete(`/api/projects`, { data: { ids: projectIds } });
      toast.success("Projects deleted successfully!");
      onProjectsDeleted(); // Refresh or remove from local state in parent
      onClose();
    } catch (error: any) {
      console.error("Error deleting projects:", error);
      toast.error("Error deleting projects. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the selected project
            {projectIds.length > 1 ? "s" : ""}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteProjects} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteProjectConfirmation;
