// src/pages/App/ContactTable.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import CreateContactModal from "../App/contacts/CreateContactModal";
import EditContactModal from "../App/contacts/EditContactModal";
import DeleteContactConfirmation from "../App/contacts/DeleteContactConfirmation";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faEdit,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faUser,
  faBuilding,
  faEnvelope,
  faMapMarkerAlt,
  faPhone,
  faCalendarAlt,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";

interface Option {
  value: string;
  label: string;
}

type Contact = {
  _id: string;
  contactType: string; // "internal" | "external"
  fullName?: string; // For internal contacts
  email?: string; // For internal contacts
  address?: string; // For internal contacts
  phone?: string; // For internal contacts
  department?: { _id: string; name: string }; // For internal contacts
  company?: string; // For external contacts
  contactPerson?: string; // For external contacts
  externalEmail?: string; // For external contacts
  externalPhone?: string; // For external contacts
  externalAddress?: string; // For external contacts
  createdAt: string;
};

// Filter options for contact type filtering
const contactTypeFilterOptions: Option[] = [
  { value: "all", label: "All" },
  { value: "internal", label: "Internal" },
  { value: "external", label: "External" },
];

export default function ContactTable() {
  const dispatch = useDispatch();
  const [data, setData] = useState<Contact[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState<boolean>(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Filter states
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<Option | null>(null);
  const [departmentsOptions, setDepartmentsOptions] = useState<Option[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  // Set page title on mount
  useEffect(() => {
    dispatch(setPageTitle("Contacts Management"));
  }, [dispatch]);

  // Fetch contacts (with pagination)
  const fetchContacts = useCallback(async () => {
    try {
      console.debug("Fetching contacts for page:", currentPage);
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/contacts?page=${currentPage}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.debug("Fetch contacts response:", response.data);
      if (
        response.data &&
        Array.isArray(response.data.contacts) &&
        typeof response.data.totalPages === "number"
      ) {
        setData(response.data.contacts);
        setTotalPages(response.data.totalPages);
        console.debug("Contacts data set:", response.data.contacts);
      } else {
        toast.error("Invalid response format from server.");
      }
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to fetch contacts. Please try again.");
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "/auth/login";
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Fetch department options for filtering (for internal contacts)
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        console.debug("Fetching departments for filter...");
        const res = await axios.get(`${API_URL}/api/departments`);
        console.debug("Departments fetch response:", res.data);
        if (Array.isArray(res.data)) {
          const opts = res.data.map((dept: any) => ({
            value: dept._id,
            label: dept.name,
          }));
          setDepartmentsOptions(opts);
          console.debug("Department options set:", opts);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        toast.error("Failed to load department filter options.");
      }
    };
    fetchDepartments();
  }, [API_URL]);

  // Debounce search query
  useEffect(() => {
    const delay = setTimeout(() => {
      console.debug("Search query updated:", searchQuery);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Filter data based on search query, contact type, and department filter
  const filteredData = useMemo(() => {
    let temp = data;
    // Filter by contact type if not "all"
    if (filterType !== "all") {
      temp = temp.filter((contact) => contact.contactType === filterType);
    }
    // For internal contacts, if a department filter is applied
    if (filterDepartment && filterType === "internal") {
      temp = temp.filter(
        (contact) =>
          contact.department && contact.department._id === filterDepartment.value
      );
    }
    // Filter by search query. For internal, use fullName; for external, use company.
    const result = temp.filter((contact) => {
      const displayName =
        contact.contactType === "internal"
          ? contact.fullName || ""
          : contact.company || "";
      return (
        [displayName, contact.phone || "", contact.email || "", contact.externalEmail || ""]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    });
    console.debug("Filtered contacts:", result);
    return result;
  }, [data, searchQuery, filterType, filterDepartment]);

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Define table columns with additional info and icons (added "Type" column)
  const columns = useMemo(
    () => [
      {
        id: "selection",
        header: (
          <input
            type="checkbox"
            checked={
              selectedContacts.length === filteredData.length &&
              filteredData.length > 0
            }
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedContacts(filteredData.map((contact) => contact._id));
              } else {
                setSelectedContacts([]);
              }
            }}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
        ),
        cell: ({ row }: { row: Row<Contact> }) => (
          <input
            type="checkbox"
            checked={selectedContacts.includes(row.original._id)}
            onChange={(e) => {
              e.stopPropagation();
              toggleContactSelection(row.original._id);
            }}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
        ),
      },
      // New "Type" Column
      {
        id: "type",
        header: (
          <div className="flex items-center text-sm font-medium text-gray-900">
            <FontAwesomeIcon icon={faInfoCircle} className="mr-1 text-gray-500" /> Type
          </div>
        ),
        cell: ({ row }: { row: Row<Contact> }) => (
          <div className="text-sm text-gray-700">
            {row.original.contactType.charAt(0).toUpperCase() + row.original.contactType.slice(1)}
          </div>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }: { row: Row<Contact> }) => {
          if (row.original.contactType === "internal") {
            return (
              <div className="flex items-center text-sm font-medium text-gray-900">
                <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-500" />
                {row.original.fullName || "–"}
              </div>
            );
          } else {
            return (
              <div className="flex items-center text-sm font-medium text-gray-900">
                <FontAwesomeIcon icon={faBuilding} className="mr-2 text-gray-500" />
                {row.original.company || "–"}
                {row.original.contactPerson ? ` - ${row.original.contactPerson}` : ""}
              </div>
            );
          }
        },
      },
      {
        id: "email",
        header: "Email",
        cell: ({ row }: { row: Row<Contact> }) => (
          <div className="flex items-center text-sm text-gray-700">
            <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-500" />
            {row.original.contactType === "internal"
              ? row.original.email || "–"
              : row.original.externalEmail || "–"}
          </div>
        ),
      },
      {
        id: "address",
        header: "Address",
        cell: ({ row }: { row: Row<Contact> }) => {
          const addr =
            row.original.contactType === "internal"
              ? row.original.address || "–"
              : row.original.externalAddress || "–";
          return (
            <div
              className="flex items-center text-sm text-gray-700 truncate"
              style={{ maxWidth: "200px" }}
              title={addr}
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-gray-500" />
              {addr}
            </div>
          );
        },
      },
      {
        id: "phone",
        header: "Phone",
        cell: ({ row }: { row: Row<Contact> }) => {
          const phoneValue =
            row.original.contactType === "internal"
              ? row.original.phone || "–"
              : row.original.externalPhone || "–";
          return (
            <div className="flex items-center text-sm text-gray-700">
              <FontAwesomeIcon icon={faPhone} className="mr-2 text-gray-500" />
              {phoneValue}
            </div>
          );
        },
      },
      {
        id: "createdAt",
        header: "Created",
        cell: ({ row }: { row: Row<Contact> }) => {
          const date = new Date(row.original.createdAt);
          return (
            <div className="flex items-center text-sm text-gray-700">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-500" />
              {date.toLocaleDateString()}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: Row<Contact> }) => (
          <div className="flex items-center gap-2">
            <Button
              className="bg-[#FBC62D] hover:bg-[#F9B023] text-white flex items-center px-2 py-1 rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedContact(row.original);
                setIsEditModalOpen(true);
              }}
            >
              <FontAwesomeIcon icon={faEdit} className="mr-1" /> Edit
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white flex items-center px-2 py-1 rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedContact(row.original);
                setIsDeleteModalOpen(true);
              }}
            >
              <FontAwesomeIcon icon={faTrash} className="mr-1" /> Delete
            </Button>
          </div>
        ),
      },
    ],
    [selectedContacts, filteredData]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  // Bulk deletion (Multi Delete) using the /bulk-delete endpoint
  const handleDeleteContacts = async () => {
    if (!selectedContacts.length) {
      toast.error("No contacts selected for deletion.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.delete("/api/contacts/bulk-delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: { contactIds: selectedContacts },
      });
      toast.success("Selected contacts deleted successfully.");
      setSelectedContacts([]);
      fetchContacts();
    } catch (error: any) {
      toast.error("Failed to delete selected contacts.");
    }
  };

  // Debounce search query
  useEffect(() => {
    const delay = setTimeout(() => {
      console.debug("Search query updated:", searchQuery);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Filter Section */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <Button
            className="bg-[#006272] hover:bg-[#004f57] text-white px-4 py-2 rounded-md"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> Create Contact
          </Button>
          {selectedContacts.length > 0 && (
            <Button
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md flex items-center"
              onClick={handleDeleteContacts}
            >
              <FontAwesomeIcon icon={faTrash} className="mr-2" /> Multi Delete
            </Button>
          )}
          {selectedContacts.length > 0 && (
            <Button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-md flex items-center"
              onClick={() => setSelectedContacts([])}
            >
              Cancel Selection
            </Button>
          )}
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Filter by Contact Type */}
          <Select
            options={contactTypeFilterOptions}
            value={contactTypeFilterOptions.find((opt) => opt.value === filterType)}
            onChange={(selected) => setFilterType(selected ? selected.value : "all")}
            placeholder="Filter by Type"
            className="w-48"
          />
          {/* Filter by Department for internal contacts */}
          {filterType === "internal" && (
            <Select
              options={departmentsOptions}
              value={filterDepartment}
              onChange={(selected) => setFilterDepartment(selected as Option)}
              placeholder="Filter by Department"
              className="w-48"
              isClearable
            />
          )}
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="panel px-4 py-5 shadow-md rounded-lg bg-white border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <span className="text-gray-500 text-lg">Loading contacts...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedContacts.includes(row.original._id)
                        ? "bg-blue-100"
                        : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <div className="text-center text-gray-600 py-4">
                      No contacts found.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {selectedContacts.length > 0 && (
              <span className="text-red-600">
                {selectedContacts.length} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-md flex items-center"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <FontAwesomeIcon icon={faChevronLeft} className="mr-1" /> Previous
            </Button>
            <span className="text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-md flex items-center"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              Next <FontAwesomeIcon icon={faChevronRight} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateContactModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onContactCreated={fetchContacts}
        />
      )}

      {isEditModalOpen && selectedContact && (
        <EditContactModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          contact={selectedContact}
          onContactUpdated={fetchContacts}
        />
      )}

      {isDeleteModalOpen && selectedContact && (
        <DeleteContactConfirmation
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          contactId={selectedContact._id}
          onContactDeleted={fetchContacts}
          multiple={false}
        />
      )}
    </div>
  );
}
