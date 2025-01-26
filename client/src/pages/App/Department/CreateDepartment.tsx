// src/pages/Departments/CreateDepartment.tsx

import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";

interface CreateDepartmentProps {
  isOpen: boolean;
  onClose: () => void;
  onDepartmentCreated: (department: Department) => void;
}

interface Department {
  _id: string;
  name: string;
  description: string;
  color: string;
}

const CreateDepartment: React.FC<CreateDepartmentProps> = ({
  isOpen,
  onClose,
  onDepartmentCreated,
}) => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [color, setColor] = useState<string>("#000000");
  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateDepartment = async () => {
    if (!name.trim()) {
      toast.error("Department name is required.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token"); // Adjust based on your auth implementation

      const response = await axios.post<Department>(
        "/api/departments",
        {
          name,
          description,
          color,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
      );

      onDepartmentCreated(response.data); // Append the new department to the list
      toast.success("Department created successfully!");
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error creating department:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to create department. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor("#000000");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Department</DialogTitle>
          <DialogDescription>
            Fill in the department details below to create a new department.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block font-bold mb-1">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter department name"
              required
            />
          </div>
          {/* Description Field */}
          <div>
            <label className="block font-bold mb-1">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter department description"
            />
          </div>
          {/* Color Picker */}
          <div>
            <label className="block font-bold mb-1">Color</label>
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-16 h-10 p-0 border-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="destructive" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreateDepartment} disabled={loading}>
            {loading ? "Creating..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDepartment;
