import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // Import for redirecting after client creation

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: () => void;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phoneNumberOne: '',
    phoneNumberTwo: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Hook for redirecting

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Handle form submission
  const handleCreateClient = async () => {
    // Basic validation
    if (!formData.name || !formData.email || !formData.address || !formData.phoneNumberOne) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/createClient', {
        name: formData.name,
        email: formData.email,
        address: formData.address,
        phoneNumberOne: formData.phoneNumberOne,
        phoneNumberTwo: formData.phoneNumberTwo,
      });
      console.log('API Response:', response.data);
      toast.success('Client created successfully!');
      onClientCreated(); // Refresh the client list in parent component
      resetForm();
      navigate('/clients'); // Redirect to ClientPage after client creation
    } catch (error: any) {
      console.error('Error creating client:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Error creating client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      address: '',
      phoneNumberOne: '',
      phoneNumberTwo: '',
    });
  };

  const handleExit = () => {
    onClose();  // Close modal
    resetForm(); // Reset form fields
    navigate('/clients'); // Redirect to client page after exit (if necessary)
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>
            Fill in the client details below to create a new client.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">
              Name<span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter client name"
            />
          </div>
          <div>
            <Label htmlFor="email">
              Email<span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter client email"
            />
          </div>
          <div>
            <Label htmlFor="address">
              Address<span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              placeholder="Enter client address"
            />
          </div>
          <div>
            <Label htmlFor="phoneNumberOne">
              Phone Number 1<span className="text-red-500">*</span>
            </Label>
            <Input
              id="phoneNumberOne"
              value={formData.phoneNumberOne}
              onChange={handleInputChange}
              required
              placeholder="Enter primary phone number"
            />
          </div>
          <div>
            <Label htmlFor="phoneNumberTwo">Phone Number 2</Label>
            <Input
              id="phoneNumberTwo"
              value={formData.phoneNumberTwo}
              onChange={handleInputChange}
              placeholder="Enter secondary phone number (optional)"
            />
          </div>
        </div>
        <DialogFooter className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={handleExit} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateClient}
            className="bg-[#006272] text-white"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClientModal;
