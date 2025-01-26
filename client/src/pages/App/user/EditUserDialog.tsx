import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import axios from "axios";
import { toast } from "react-hot-toast";

interface Department {
  _id: string;
  name: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "User" | "Admin";
  department?: Department;
}

interface EditUserDialogProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void; // Callback to refresh the data after update
}

export function EditUserDialog({ user, onClose, onUpdate }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    role: user.role || "User",
    password: "",
    department: user.department?._id || "",
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get("/api/departments", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Add token to headers
          },
        });
        setDepartments(response.data || []);
      } catch (error) {
        console.error("Error fetching departments:", error);
        toast.error("Failed to fetch departments.");
      }
    };

    fetchDepartments();
  }, []);

  // Handle input field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => {
      if (prev[id] === value) return prev; // Prevent unnecessary re-renders
      return { ...prev, [id]: value };
    });
  };

  // Handle role change
  const handleRoleChange = (value: "User" | "Admin") => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  // Handle department change
  const handleDepartmentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, department: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const payload: any = { currentEmail: user.email };

      // Compare old data with new form data and include only changed fields
      if (formData.firstName !== user.firstName) payload.firstName = formData.firstName;
      if (formData.lastName !== user.lastName) payload.lastName = formData.lastName;
      if (formData.email !== user.email) payload.newEmail = formData.email;
      if (formData.role !== user.role) payload.role = formData.role;
      if (formData.password) payload.password = formData.password;
      if (formData.department !== user.department?._id) payload.department = formData.department;

      console.log("Update Request Payload:", payload); // Debugging log

      await axios.put("/api/users/updateUser", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("User updated successfully.");
      onClose();
      onUpdate(); // Refresh parent data
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update user. Please try again.";
      toast.error(errorMessage);
      console.error("Error updating user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Edit the user's information below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-wrap -mx-2">
            {/* First Name */}
            <div className="w-full md:w-1/2 px-2 mb-4">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Last Name */}
            <div className="w-full md:w-1/2 px-2 mb-4">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Email */}
            <div className="w-full px-2 mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Password */}
            <div className="w-full px-2 mb-4">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Leave blank to keep current password"
                onChange={handleInputChange}
              />
            </div>

            {/* Role */}
            <div className="w-full px-2 mb-4">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div className="w-full px-2 mb-4">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={handleDepartmentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update User"}
            </Button>
            <Button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
