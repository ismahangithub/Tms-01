// src/pages/App/projects/DeleteProject.tsx

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

interface DeleteProjectProps {
  isOpen: boolean;        // Whether the alert dialog is open
  onClose: () => void;    // Callback to close the dialog
  projectId: string;      // The single project ID to delete
  onDeleted: () => void;  // Callback after successful deletion
}

const DeleteProject: React.FC<DeleteProjectProps> = ({
  isOpen,
  onClose,
  projectId,
  onDeleted,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      console.log("Single Delete - Project ID:", projectId);

      // Single-project delete endpoint
      await axios.delete(`/api/projects/${projectId}`);
      toast.success("Project deleted successfully!");
      onDeleted();   // Let parent component (ProjectCard or ProjectTable) handle UI changes
      onClose();     // Close dialog
    } catch (err: any) {
      console.error("Error deleting project:", err);
      toast.error("Failed to delete project. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this project? This action is irreversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteProject;
