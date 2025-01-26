import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";

interface Department {
  _id: string;
  name: string;
  description: string;
  color: string;
}

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditMode, setEditMode] = useState(false);
  const [currentDepartmentId, setCurrentDepartmentId] = useState<string | null>(null);

  // Form state for department
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#000000");

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get("/api/departments");
        setDepartments(response.data);
      } catch (err) {
        setError("Failed to fetch departments");
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleSaveDepartment = async () => {
    try {
      if (isEditMode && currentDepartmentId) {
        const response = await axios.put(`/api/departments/${currentDepartmentId}`, { name, description, color });
        setDepartments((prev) => prev.map((dep) => (dep._id === currentDepartmentId ? response.data : dep)));
      } else {
        const response = await axios.post("/api/departments", { name, description, color });
        setDepartments((prev) => [...prev, response.data]);
      }
      handleCloseModal();
    } catch (error) {
      alert("Failed to save department");
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (confirm("Are you sure you want to delete this department?")) {
      try {
        await axios.delete(`/api/departments/${id}`);
        setDepartments((prev) => prev.filter((dep) => dep._id !== id));
      } catch (error) {
        alert("Failed to delete department");
      }
    }
  };

  const handleOpenModal = (department?: Department) => {
    if (department) {
      setEditMode(true);
      setCurrentDepartmentId(department._id);
      setName(department.name);
      setDescription(department.description);
      setColor(department.color);
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    resetForm();
    // Reload the page when modal is closed
    window.location.reload();
  };

  const resetForm = () => {
    setEditMode(false);
    setCurrentDepartmentId(null);
    setName("");
    setDescription("");
    setColor("#000000");
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Departments</h1>
        <Button
          className="bg-[#006272] text-white px-4 py-2 rounded"
          onClick={() => handleOpenModal()}
        >
          New Department
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {departments.map((department) => (
            <div
              key={department._id}
              className="shadow-md hover:shadow-lg transition-shadow border-l-4 p-4 rounded-lg bg-white"
              style={{ borderLeftColor: department.color }}
            >
              <h3 className="text-lg font-bold mb-2">{department.name}</h3>
              <p className="text-gray-600">{department.description}</p>
              <div className="flex justify-end mt-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="text-gray-600 px-2 py-1 bg-transparent border-none hover:bg-gray-100 focus:ring-0">
                      ...
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white shadow-md rounded-lg">
                    <DropdownMenuItem
                      onClick={() => handleOpenModal(department)}
                      className="bg-[#006272] text-white cursor-pointer"
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteDepartment(department._id)}
                      className="text-red-600 cursor-pointer"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Department Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Department" : "Create New Department"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block font-bold mb-1">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter department name"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter department description"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Color</label>
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              className="bg-red-600 text-white px-4 py-2 rounded"
              onClick={() => {
                handleCloseModal();
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#006272] text-white px-4 py-2 rounded"
              onClick={handleSaveDepartment}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Departments;
