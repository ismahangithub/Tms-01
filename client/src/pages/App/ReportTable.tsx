// src/pages/App/tasks/ReportTable.tsx

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
import CreateReportModal from "./report/CreateReport";
import EditReportModal from "./report/EditReportModal";
import DeleteReportConfirmation from "./report/DeleteReportConfirmation";
import ViewReportModal from "./report/ViewReportModal";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faEdit,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faEye,
  faFileAlt,
  faClipboardList,
  faUser,
  faCalendar,
} from "@fortawesome/free-solid-svg-icons";

// Type for a Report
type Report = {
  _id: string;
  title: string;
  content: string;
  scope: string;
  createdBy: { firstName: string; lastName: string };
  createdAt: string;
};

export default function ReportTable() {
  const dispatch = useDispatch();
  const [data, setData] = useState<Report[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScope, setFilterScope] = useState("all"); // New filter for scope
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Set page title on component mount
  useEffect(() => {
    dispatch(setPageTitle("Reports Management"));
  }, [dispatch]);

  // Function to fetch reports based on currentPage
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/reports?page=${currentPage}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (
        response.data &&
        Array.isArray(response.data.reports) &&
        typeof response.data.totalPages === "number"
      ) {
        const reports: Report[] = response.data.reports.map((report: any) => ({
          _id: report._id,
          title: report.title,
          content: report.content,
          scope: report.scope,
          createdBy: report.createdBy,
          createdAt: report.createdAt,
        }));

        setData(reports);
        setTotalPages(response.data.totalPages);
      } else {
        toast.error("Invalid response format from the server.");
      }
    } catch (error: any) {
      toast.error("Failed to fetch reports. Please try again.");
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "/auth/login";
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  // Fetch reports on currentPage change
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Debounce search query changes (500ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Nothing to do here—filteredData will update via useMemo
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Memoized filtered data based on search query and scope filter
  const filteredData = useMemo(() => {
    let filtered = data.filter((report) =>
      [report.title, report.content, report.scope]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
    if (filterScope !== "all") {
      filtered = filtered.filter(
        (report) => report.scope.toLowerCase() === filterScope
      );
    }
    return filtered;
  }, [data, searchQuery, filterScope]);

  const toggleReportSelection = (reportId: string) => {
    setSelectedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  // Define columns for the table (memoized)
  const columns = useMemo(
    () => [
      {
        id: "selection",
        header: (
          <input
            type="checkbox"
            checked={
              selectedReports.length === filteredData.length &&
              filteredData.length > 0
            }
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedReports(filteredData.map((report) => report._id));
              } else {
                setSelectedReports([]);
              }
            }}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
        ),
        cell: ({ row }: { row: Row<Report> }) => (
          <input
            type="checkbox"
            checked={selectedReports.includes(row.original._id)}
            onChange={(e) => {
              e.stopPropagation();
              toggleReportSelection(row.original._id);
            }}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
        ),
      },
      {
        id: "title",
        header: <FontAwesomeIcon icon={faFileAlt} className="mr-2" />,
        accessorKey: "title",
        cell: ({ row }: { row: Row<Report> }) => (
          <div className="text-sm font-medium text-gray-900">
            {row.original.title}
          </div>
        ),
      },
      {
        id: "scope",
        header: <FontAwesomeIcon icon={faClipboardList} className="mr-2" />,
        accessorKey: "scope",
        cell: ({ row }: { row: Row<Report> }) => (
          <div className="text-sm text-gray-700">{row.original.scope}</div>
        ),
      },
      {
        id: "createdAt",
        header: <FontAwesomeIcon icon={faCalendar} className="mr-2" />,
        accessorKey: "createdAt",
        cell: ({ row }: { row: Row<Report> }) => {
          const createdAt = new Date(row.original.createdAt);
          return (
            <div className="text-sm text-gray-700">
              {createdAt.toLocaleDateString()}
            </div>
          );
        },
      },
      {
        id: "createdBy",
        header: <FontAwesomeIcon icon={faUser} className="mr-2" />,
        accessorKey: "createdBy",
        cell: ({ row }: { row: Row<Report> }) => (
          <div className="text-sm text-gray-700">
            {row.original.createdBy.firstName} {row.original.createdBy.lastName}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: Row<Report> }) => (
          <div className="flex items-center gap-2">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center px-2 py-1 rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedReport(row.original);
                setIsEditModalOpen(true);
              }}
            >
              <FontAwesomeIcon icon={faEdit} className="mr-1" /> Edit
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white flex items-center px-2 py-1 rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedReport(row.original);
                setIsDeleteModalOpen(true);
              }}
            >
              <FontAwesomeIcon icon={faTrash} className="mr-1" /> Delete
            </Button>
            <Button
              className="bg-gray-600 hover:bg-gray-700 text-white flex items-center px-2 py-1 rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                setViewReport(row.original);
              }}
            >
              <FontAwesomeIcon icon={faEye} className="mr-1" /> View
            </Button>
          </div>
        ),
      },
    ],
    [selectedReports, filteredData]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="panel px-4 py-5 shadow-md rounded-lg bg-white border border-gray-200">
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <Button
              className="bg-[#006272] hover:bg-[#004f57] text-white px-4 py-2 rounded-md"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" /> Create Report
            </Button>
            {selectedReports.length > 0 && (
              <Button
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md flex items-center"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Delete Selected
              </Button>
            )}
            {selectedReports.length > 0 && (
              <Button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-md flex items-center"
                onClick={() => setSelectedReports([])}
              >
                Cancel Selection
              </Button>
            )}
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Additional Filter for Scope */}
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="border rounded-md p-2"
            >
              <option value="all">All Scopes</option>
              <option value="department">Department</option>
              <option value="project">Project</option>
              <option value="task">Task</option>
              <option value="client">Client</option>
            </select>
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <Input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <span className="text-gray-500 text-lg">Loading reports...</span>
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
                      selectedReports.includes(row.original._id) ? "bg-blue-100" : ""
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
                      No reports found.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {selectedReports.length > 0 && (
              <span className="text-red-600">
                {selectedReports.length} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="bg-[#FBC62D] hover:bg-[#E8B72C] px-3 py-1 rounded-md flex items-center"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <FontAwesomeIcon icon={faChevronLeft} className="mr-1" /> Previous
            </Button>
            <span className="text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              className="bg-[#FBC62D] hover:bg-[#E8B72C] px-3 py-1 rounded-md flex items-center"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              Next <FontAwesomeIcon icon={faChevronRight} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {isDeleteModalOpen && selectedReport && (
        <DeleteReportConfirmation
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          reportId={selectedReport._id}
          onReportDeleted={fetchReports}
          multiple={false}
        />
      )}

      {isCreateModalOpen && (
        <CreateReportModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onReportCreated={fetchReports}
        />
      )}

      {isEditModalOpen && selectedReport && (
        <EditReportModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          report={selectedReport}
          onReportUpdated={fetchReports}
        />
      )}

      {viewReport && (
        <ViewReportModal
          isOpen={!!viewReport}
          onClose={() => setViewReport(null)}
          report={viewReport}
        />
      )}
    </div>
  );
}
