// src/pages/App/contacts/DeleteContactConfirmation.tsx

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faTimes } from "@fortawesome/free-solid-svg-icons";

interface DeleteContactConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  onContactDeleted: () => void;
  multiple?: boolean;
}

const DeleteContactConfirmation: React.FC<DeleteContactConfirmationProps> = ({
  isOpen,
  onClose,
  contactId,
  onContactDeleted,
  multiple = false,
}) => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      navigate("/auth/login");
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/contacts/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Contact deleted successfully.");
      onContactDeleted();
      onClose();
    } catch (error: any) {
      toast.error("Failed to delete contact.");
    }
  };

  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md p-6 bg-white rounded-lg shadow-lg"
        style={{ minWidth: "400px" }}
      >
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl font-semibold text-red-600 flex items-center gap-2">
            <FontAwesomeIcon icon={faTrash} /> Confirm Deletion
          </DialogTitle>
          {/* <Button variant="ghost" onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <FontAwesomeIcon icon={faTimes} />
          </Button> */}
        </DialogHeader>
        <div className="mt-4">
          <p className="text-gray-700">
            Are you sure you want to delete this contact?
          </p>
        </div>
        <DialogFooter className="mt-6 flex justify-end gap-3">
          <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2">
            Delete
          </Button>
          <Button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteContactConfirmation;
