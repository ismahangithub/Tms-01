import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input, Textarea } from '../../../components/ui/input';
import Select from 'react-select';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import the Quill styles
import { useNavigate } from 'react-router-dom';

interface EditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report;
  onReportUpdated: () => void;
}

type Report = {
  _id: string;
  title: string;
  content: string;
  scope: string;
  createdBy: { firstName: string; lastName: string };
  createdAt: string;
  client?: any[];
  department?: any[];
  project?: any[];
  task?: any[];
};

const EditReportModal: React.FC<EditReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onReportUpdated,
}) => {
  const [title, setTitle] = useState(report.title);
  const [content, setContent] = useState(report.content);
  const [scope, setScope] = useState<string | null>(report.scope);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clientsResponse, departmentsResponse, projectsResponse] = await Promise.all([
          axios.get('/api/clients'),
          axios.get('/api/departments'),
          axios.get('/api/projects'),
        ]);
        setClients(clientsResponse.data);
        setDepartments(departmentsResponse.data);
        setProjects(projectsResponse.data);
        if (report.scope === 'project' && report.project) {
          const projectIds = Array.isArray(report.project)
            ? report.project.map((proj: any) => proj._id).join(',')
            : report.project._id;
          const tasksResponse = await axios.get(`/api/tasks?projectIds=${projectIds}`);
          setTasks(tasksResponse.data);
        } else {
          setTasks([]);
        }
      } catch (error) {
        toast.error('Failed to load selection data.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
      setSelectedItems(
        report.scope === 'client'
          ? report.client?.map((client: any) => ({
              value: client._id,
              label: client.name,
            })) || []
          : report.scope === 'department'
          ? report.department?.map((dept: any) => ({
              value: dept._id,
              label: dept.name,
            })) || []
          : report.scope === 'project'
          ? report.project?.map((proj: any) => ({
              value: proj._id,
              label: proj.name,
            })) || []
          : report.scope === 'task'
          ? report.task?.map((task: any) => ({
              value: task._id,
              label: task.name,
            })) || []
          : []
      );
    }
  }, [isOpen, report]);

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

    if (scope === 'client') formData.client = selectedItems.map((item) => item.value);
    if (scope === 'department') formData.department = selectedItems.map((item) => item.value);
    if (scope === 'project') formData.project = selectedItems.map((item) => item.value);
    if (scope === 'task') formData.task = selectedItems.map((item) => item.value);

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required. Redirecting to login...');
      navigate('/auth/login');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(`/api/reports/${report._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Report updated successfully!');
      onReportUpdated();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to update report.');
    } finally {
      setLoading(false);
    }
  };

  const handleScopeChange = (selectedOption: any) => {
    setScope(selectedOption ? selectedOption.value : null);
    setSelectedItems([]);
    setTasks([]);
  };

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
            <label className="block text-sm font-medium text-gray-700">Select Projects</label>
            <Select
              options={projects.map((project) => ({
                value: project._id,
                label: project.name,
              }))}
              value={selectedItems}
              onChange={setSelectedItems}
              placeholder="Select Projects"
              className="mt-1"
            />
            {tasks.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Select Tasks</label>
                <Select
                  isMulti
                  options={tasks.map((task) => ({
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
              options={tasks.map((task) => ({
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
      <DialogContent className="max-w-2xl p-6 bg-white rounded-lg shadow-lg">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FontAwesomeIcon icon={faEdit} /> Edit Report
          </DialogTitle>
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
                  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
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
            <label className="block text-sm font-medium text-gray-700">Scope</label>
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
          <Button variant="outline" onClick={onClose} className="px-4 py-2">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="#006272 hover:bg-#006272 text-white px-4 py-2 flex items-center"
          >
            {loading ? 'Updating...' : <>
              <FontAwesomeIcon icon={faEdit} className="mr-2" /> Update Report
            </>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditReportModal;
