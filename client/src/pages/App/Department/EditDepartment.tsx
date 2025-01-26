// src/pages/Departments/EditDepartment.tsx

import React, { useState, useEffect } from "react";
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

interface EditDepartmentProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department;
  onDepartmentUpdated: (department: Department) => void;
}

interface Department {
  _id: string;
  name: string;
  description: string;
  color: string;
}

const EditDepartment: React.FC<EditDepartmentProps> = ({
  isOpen,
  onClose,
  department,
  onDepartmentUpdated,
}) => {
  const [name, setName] = useState<string>(department.name);
  const [description, setDescription] = useState<string>(department.description);
  const [color, setColor] = useState<string>(department.color);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setName(department.name);
      setDescription(department.description);
      setColor(department.color);
    }
  }, [isOpen, department]);

  const handleUpdateDepartment = async () => {
    if (!name.trim()) {
      toast.error("Department name is required.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put<Department>(`/api/departments/${department._id}`, {
        name,
        description,
        color,
      });
      onDepartmentUpdated(response.data); // Pass the updated department back to parent
      toast.success("Department updated successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error updating department:", error.response?.data || error.message);
      toast.error("Failed to update department. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>
            Modify the department details below to update the department.
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
          <Button onClick={handleUpdateDepartment} disabled={loading}>
            {loading ? "Updating..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditDepartment;
