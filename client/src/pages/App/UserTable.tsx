// Import dependencies
import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { setPageTitle } from "../../store/themeConfigSlice";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  SortingState,
  useReactTable,
  getCoreRowModel,
  flexRender,
  Row,
} from "@tanstack/react-table";
import { CreateUser } from "./user/CreateUser";
import { EditUserDialog } from "./user/EditUserDialog";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPlus,
  faTrash,
  faEdit,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";

// User type definition
type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  role: string;
  department?: {
    _id: string;
    name: string;
  };
};

export default function UserTable() {
  const dispatch = useDispatch();
  const [data, setData] = useState<User[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showDeleteMode, setShowDeleteMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    dispatch(setPageTitle("Users Management"));
    fetchUsers();
  }, [dispatch, currentPage]);

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/users?page=${currentPage}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const users: User[] = response.data.users.map((user: any) => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        createdAt: user.createdAt,
        role: user.role,
        department: user.department,
      }));

      setData(users);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users. Please try again.");
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "/auth/login"; // Redirect to login
      }
    }
  };

  // Delete Selected Users
  const handleDeleteUsers = async () => {
    if (!selectedUsers.length) {
      toast.error("No users selected for deletion.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.delete("/api/users/delete", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { userIds: selectedUsers },
      });

      toast.success("Selected users deleted successfully.");
      setSelectedUsers([]);
      setShowDeleteMode(false);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting users:", error);
      toast.error("Failed to delete selected users.");
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredData = useMemo(() => {
    return data.filter(
      (user) =>
        (!selectedDepartment || user.department?._id === selectedDepartment) &&
        (!selectedRole || user.role === selectedRole) &&
        (user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [data, searchQuery, selectedDepartment, selectedRole]);

  const columns = useMemo(
    () => [
      ...(showDeleteMode
        ? [
            {
              accessorKey: "select",
              header: "Select",
              cell: ({ row }: { row: Row<User> }) => (
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(row.original.id)}
                  onChange={() => handleSelectUser(row.original.id)}
                />
              ),
            },
          ]
        : []),
      {
        id: "name",
        header: "Name",
        cell: ({ row }: { row: Row<User> }) => (
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUser} className="text-[#006272]" />
            {`${row.original.firstName} ${row.original.lastName}`}
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }: { row: Row<User> }) => {
          const createdAt = new Date(row.original.createdAt);
          return createdAt.toLocaleDateString();
        },
      },
      {
        accessorKey: "role",
        header: "Role",
      },
      {
        id: "department",
        header: "Department",
        cell: ({ row }: { row: Row<User> }) =>
          row.original.department ? row.original.department.name : "N/A",
      },
      {
        id: "editUser",
        header: "Actions",
        cell: ({ row }: { row: Row<User> }) => (
          <Button

            className="bg-[#006272] hover:bg-[#004a54] text-white font-semibold px-2 py-1 rounded-md"
            onClick={() => setSelectedUser(row.original)}
          >
            <FontAwesomeIcon icon={faEdit} /> Edit
          </Button>
        ),
      },
    ],
    [showDeleteMode, selectedUsers]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="panel px-4 py-5 shadow-md rounded-lg bg-white border border-gray-200">
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3">
        <CreateUser onUserCreated={fetchUsers} />
        <Button
          className={`${
            showDeleteMode ? "bg-red-600" : "bg-red-500"
          } hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md`}
          onClick={() =>
            showDeleteMode ? handleDeleteUsers() : setShowDeleteMode(true)
          }
        >
          <FontAwesomeIcon icon={faTrash} /> {showDeleteMode ? "Confirm Delete" : "Delete Users"}
        </Button>
        {showDeleteMode && (
          <Button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-md"
            onClick={() => {
              setSelectedUsers([]);
              setShowDeleteMode(false);
            }}
          >
            Cancel
          </Button>
        )}
        <Input
          placeholder="Search users"
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-md rounded-md border px-3 py-2 shadow-sm"
        />
        <div className="flex gap-2">
          <select
            className="border rounded-md px-2 py-1"
            onChange={(e) => setSelectedDepartment(e.target.value || null)}
          >
            <option value="">All Departments</option>
            {/* Populate with department options dynamically if needed */}
          </select>
          <select
            className="border rounded-md px-2 py-1"
            onChange={(e) => setSelectedRole(e.target.value || null)}
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
        </div>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 flex justify-center gap-2">
        <Button
          className="bg-[#FBC62D] hover:bg-[#E8B72C] px-3 py-1 rounded-md"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          Previous
        </Button>
        <span>Page {currentPage} of {totalPages}</span>
        <Button
          className="bg-[#FBC62D] hover:bg-[#E8B72C] px-3 py-1 rounded-md"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        >
          Next
        </Button>
      </div>

      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
}
