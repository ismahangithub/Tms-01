import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import CreateClientModal from './clients/CreateClient';
import EditClientModal from './clients/EditClient';
import DeleteClientConfirmation from './clients/DeleteClient';
import IconPencil from '../../components/Icon/IconPencil';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconUserPlus from '../../components/Icon/IconUserPlus';

interface Client {
  _id: string;
  name: string;
  email: string;
  address: string;
  phoneNumberOne: string;
  phoneNumberTwo: string;
}

const ClientPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (err) {
      setError('Error fetching client data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter((client) => client.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const currentClients = filteredClients.slice(
    pagination.pageIndex * pagination.pageSize,
    (pagination.pageIndex + 1) * pagination.pageSize
  );
  const totalPages = Math.ceil(filteredClients.length / pagination.pageSize);

  const handlePageChange = (newPageIndex: number) => {
    setPagination((prev) => ({ ...prev, pageIndex: newPageIndex }));
  };

  const handleCreateModal = () => setCreateModalOpen(true);
  const handleEditModal = (client: Client) => {
    setSelectedClient(client);
    setEditModalOpen(true);
  };
  const handleDeleteModal = (client: Client) => {
    setSelectedClient(client);
    setDeleteModalOpen(true);
  };

  const handleClientCreated = (newClient: Client) => {
    setClients((prev) => [newClient, ...prev]);
    setCreateModalOpen(false);
  };

  const handleClientUpdated = useCallback(async (updatedClient: Client) => {
    setClients((prevClients) =>
      prevClients.map((client) => (client._id === updatedClient._id ? updatedClient : client))
    );
    setEditModalOpen(false);
    setSelectedClient(null);
  }, []);

  const handleClientDeleted = (clientId: string) => {
    setClients((prev) => prev.filter((client) => client._id !== clientId));
    setDeleteModalOpen(false);
    setSelectedClient(null);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto p-6">
      {/* Header with Search and Add New Client Button */}
      <div className="flex justify-between items-center mb-6 bg-gray-100 p-4 rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="Search clients by name..."
          className="p-2 w-full max-w-xs border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          onClick={handleCreateModal}
          className="ml-4 bg-[#006272] text-white font-bold flex items-center"
        >
          <IconUserPlus className="mr-2" /> Add New Client
        </Button>
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {currentClients.map((client, index) => (
          <Card
            key={client._id}
            className="relative shadow-md border border-gray-200 rounded-lg transform transition-transform hover:scale-105 hover:shadow-lg group"
          >
            {/* Top border line with alternating colors */}
            <div
              className="rounded-t-lg"
              style={{
                height: '4px',
                backgroundColor: index % 2 === 0 ? '#3b82f6' : '#f59e0b', // Alternates between blue and orange
              }}
            />

            {/* Dropdown Menu - Initially hidden, only visible on hover */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleEditModal(client)}>
                  <IconPencil className="mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDeleteModal(client)}>
                  <IconTrashLines className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <CardHeader className="pt-2">
              <div className="flex items-center space-x-3">
                {/* Name Prefix Circle */}
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-300 text-white font-semibold">
                  {client.name.slice(0, 2).toUpperCase()}
                </div>

                {/* Client Name */}
                <h3 className="text-lg font-semibold">{client.name}</h3>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-gray-600">Email: {client.email}</p>
              <p className="text-sm text-gray-600">Phone 1: {client.phoneNumberOne}</p>
              <p className="text-sm text-gray-600">Address: {client.address}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-gray-500">
          Showing {pagination.pageIndex * pagination.pageSize + 1} -{' '}
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredClients.length)} of{' '}
          {filteredClients.length} clients
        </span>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(pagination.pageIndex - 1, 0))}
            disabled={pagination.pageIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.min(pagination.pageIndex + 1, totalPages - 1))}
            disabled={(pagination.pageIndex + 1) * pagination.pageSize >= filteredClients.length}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Modals */}
      {selectedClient && (
        <EditClientModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          client={selectedClient}
          onClientUpdated={handleClientUpdated}
        />
      )}
      <CreateClientModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onClientCreated={handleClientCreated}
      />
      <DeleteClientConfirmation
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        clientId={selectedClient?._id || ''}
        onClientDeleted={handleClientDeleted}
      />
    </div>
  );
};

export default ClientPage;
