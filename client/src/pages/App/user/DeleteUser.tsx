import React, { useState } from "react";
import axios from "axios";

import { toast } from "react-hot-toast";
import { Button } from "../../../components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "../../../components/ui/alert-dialog";


type DeleteUserDialogProps = {
  user: { email: string; name: string } | null; // User information passed as props
  onDeleteSuccess: () => void; // Callback to refresh the user table after deletion
};

export function DeleteUserDialog({ user, onDeleteSuccess }: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authorization token is missing. Please log in again.");
        return;
      }

      const response = await axios.delete("/api/users/delete", {
        headers: {
          Authorization: `Bearer ${token}`, // Attach the token
        },
        data: { email: user.email }, // Send the email in the request body
      });

      if (response.status === 200) {
        toast.success(`User ${user.name} deleted successfully`);
        onDeleteSuccess(); // Trigger a refresh in the parent component
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "An error occurred while deleting the user";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-2 py-1 rounded-md"
          disabled={loading}
        >
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{user?.name}</strong>? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Confirm"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
