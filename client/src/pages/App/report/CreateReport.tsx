// src/pages/App/tasks/CreateReportModal.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import Select from 'react-select';
import axios from 'axios';
import toast from 'react-hot-toast';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated: () => void;
}

interface Option {
  value: string;
  label: string;
}

const CreateReportModal: React.FC<CreateReportModalProps> = ({
  isOpen,
  onClose,
  onReportCreated,
}) => {
  // Form state variables
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Option[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<Option | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  // Fetch data for dropdowns when modal opens
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clientsRes, departmentsRes, projectsRes] = await Promise.all([
          axios.get(`${API_URL}/api/clients`),
          axios.get(`${API_URL}/api/departments`),
          axios.get(`${API_URL}/api/projects`),
        ]);
        // Ensure data is an array
        setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
        setDepartments(Array.isArray(departmentsRes.data) ? departmentsRes.data : []);
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : (projectsRes.data.projects || []));
        setTasks([]); // Initialize tasks as empty; will be fetched based on selected project
      } catch (error) {
        toast.error('Failed to load selection data.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, API_URL]);

  // Fetch tasks based on selected project if scope is "project"
  useEffect(() => {
    const fetchTasks = async () => {
      if (scope === 'project' && selectedProject) {
        try {
          setLoading(true);
          const tasksResponse = await axios.get(`${API_URL}/api/tasks?projectId=${selectedProject.value}`);
          // Ensure tasks are an array
          setTasks(Array.isArray(tasksResponse.data) ? tasksResponse.data : []);
        } catch (error) {
          toast.error('Failed to load tasks for selected project.');
        } finally {
          setLoading(false);
        }
      } else {
        setTasks([]);
      }
    };
    fetchTasks();
  }, [scope, selectedProject, API_URL]);

  // Submit form handler
  const handleSubmit = async () => {
    if (!title || !content || !scope || selectedItems.length === 0) {
      toast.error('Please fill in all fields.');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('User ID not found. Please log in.');
      navigate('/auth/login');
      return;
    }

    const formData: any = {
      title,
      content,
      scope,
      createdBy: userId,
    };

    if (scope === 'client') {
      formData.client = selectedItems.map((item) => item.value);
    }
    if (scope === 'department') {
      formData.department = selectedItems.map((item) => item.value);
    }
    if (scope === 'project') {
      formData.project = selectedProject ? selectedProject.value : null;
    }
    if (scope === 'task') {
      formData.task = selectedItems.map((item) => item.value);
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required. Redirecting to login...');
      navigate('/auth/login');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/reports', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Report created successfully!');
      onReportCreated();
      onClose();

      // Reset form fields
      setTitle('');
      setContent('');
      setScope(null);
      setSelectedItems([]);
      setTasks([]);
      setSelectedProject(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to create report.');
    } finally {
      setLoading(false);
    }
  };

  // Handle scope change to reset selected items and tasks
  const handleScopeChange = (selectedOption: Option | null) => {
    setScope(selectedOption ? selectedOption.value : null);
    setSelectedItems([]);
    setTasks([]);
    setSelectedProject(null);
  };

  // Render selection fields dynamically based on the selected scope
  const renderSelectionField = () => {
    switch (scope) {
      case 'client':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Clients</label>
            <Select
              isMulti
              options={clients.map((client) => ({
                value: client._id,
                label: client.name,
              }))}
              value={selectedItems}
              onChange={setSelectedItems}
              placeholder="Select Clients"
              className="mt-1"
            />
          </div>
        );
      case 'department':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Departments</label>
            <Select
              isMulti
              options={departments.map((department) => ({
                value: department._id,
                label: department.name,
              }))}
              value={selectedItems}
              onChange={setSelectedItems}
              placeholder="Select Departments"
              className="mt-1"
            />
          </div>
        );
      case 'project':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Project</label>
            <Select
              options={projects.map((proj) => ({
                value: proj._id,
                label: proj.name,
              }))}
              value={selectedProject}
              onChange={(selectedOption) => setSelectedProject(selectedOption)}
              placeholder="Select Project"
              className="mt-1"
            />
            {selectedProject && tasks.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Select Tasks</label>
                <Select
                  isMulti
                  options={tasks.map((task: any) => ({
                    value: task._id,
                    label: task.name,
                  }))}
                  value={selectedItems}
                  onChange={setSelectedItems}
                  placeholder="Select Tasks"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        );
      case 'task':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Tasks</label>
            <Select
              isMulti
              options={tasks.map((task: any) => ({
                value: task._id,
                label: task.name,
              }))}
              value={selectedItems}
              onChange={setSelectedItems}
              placeholder="Select Tasks"
              className="mt-1"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl p-6 bg-white rounded-lg shadow-lg"
        style={{
          minWidth: "700px",
          maxWidth: "700px",
          maxHeight: "75vh",
          overflowY: "auto",
        }}
      >
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl font-semibold text-[#006272] flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} /> Create New Report
          </DialogTitle>
          {/* <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button> */}
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Report Title"
              required
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <ReactQuill
              value={content}
              onChange={setContent}
              modules={{
                toolbar: [
                  [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['bold', 'italic', 'underline'],
                  [{ 'align': [] }],
                  ['link', 'image'],
                ],
              }}
              placeholder="Write your report content here"
              className="mt-1 h-48"
            />
          </div>
          <div>
            {/* <label className="block text-sm font-medium text-gray-700">Scope</label> */}
            <Select
              options={[
                { value: 'client', label: 'Client' },
                { value: 'department', label: 'Department' },
                { value: 'project', label: 'Project' },
                { value: 'task', label: 'Task' },
              ]}
              value={scope ? { value: scope, label: scope.charAt(0).toUpperCase() + scope.slice(1) } : null}
              onChange={handleScopeChange}
              placeholder="Select Scope"
              className="mt-1"
            />
          </div>
          {renderSelectionField()}
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-3">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#006272] hover:bg-[#004f57] text-white px-4 py-2 flex items-center"
          >
            {loading ? 'Creating...' : (<><FontAwesomeIcon icon={faPlus} className="mr-2" /> Create Report</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateReportModal;
