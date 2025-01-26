import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";
import { toast } from "react-hot-toast";
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";

export const CreateUser = ({ onUserCreated }) => {
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "User",
    department: "",
  });
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch departments from backend on component mount
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
  const handleInputChange = (event) => {
    const { id, value } = event.target;
    setNewUser((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  // Form validity check
  const isFormValid =
    newUser.firstName &&
    newUser.lastName &&
    newUser.email &&
    newUser.password &&
    newUser.role &&
    newUser.department;

  // Form submission handler
  const submitForm = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("/api/users/createUser", newUser, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Add token to headers
        },
      });

      if (response.status === 201) {
        // Reset the form
        setNewUser({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "User",
          department: "",
        });

        toast.success("User created successfully");

        // Close the dialog
        setDialogOpen(false);

        // Call the callback to refresh the UserTable
        onUserCreated(); // This will trigger the fetchUsers in UserTable

        // Redirect to the user list after successful creation
        navigate("/usersList");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "An error occurred while creating the user.";
      console.error("Error creating user:", error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="relative w-full md:w-auto flex items-center justify-center rounded-md border px-5 py-2 text-sm font-semibold bg-[#00ab55] text-white"
            disabled={loading}
          >
            {loading ? "Loading..." : "Create User"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Fill out the form below to create a new user.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm}>
            <div className="flex flex-wrap justify-between -mx-2">
              {/* First Name */}
              <div className="w-full md:w-1/2 px-2 mb-4">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="First Name"
                  value={newUser.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Last Name */}
              <div className="w-full md:w-1/2 px-2 mb-4">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Last Name"
                  value={newUser.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Email */}
              <div className="w-full md:w-1/2 px-2 mb-4">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Email"
                  type="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="w-full md:w-1/2 px-2 mb-4">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  placeholder="Password"
                  type="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Role Selection */}
              <div className="w-full md:w-1/2 px-2 mb-4">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) =>
                    setNewUser((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department Selection */}
              <div className="w-full md:w-1/2 px-2 mb-4">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={newUser.department}
                  onValueChange={(value) =>
                    setNewUser((prev) => ({ ...prev, department: value }))
                  }
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
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

            {/* Dialog Footer */}
            <DialogFooter>
              <Button type="submit" disabled={loading || !isFormValid}>
                {loading ? "Creating..." : "Create"}
              </Button>
              <Button
                type="button"
                onClick={() => setDialogOpen(false)} // Close the dialog
                className="bg-gray-300 px-4 py-2 rounded-md"
                disabled={loading}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
