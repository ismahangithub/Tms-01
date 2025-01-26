import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../../../components/ui/alert-dialog';

interface DeleteClientConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onClientDeleted: (clientId: string) => void;
}

const DeleteClientConfirmation: React.FC<DeleteClientConfirmationProps> = ({
  isOpen,
  onClose,
  clientId,
  onClientDeleted,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDeleteClient = async () => {
    try {
      setLoading(true);
      console.log(`Attempting to delete client with ID: ${clientId}`); // Debugging log
      await axios.delete(`/api/clients/${clientId}`);
      toast.success('Client deleted successfully!');
      onClientDeleted(clientId); // Notify parent to refresh list
      onClose(); // Close the modal
    } catch (error: any) {
      console.error('Error deleting client:', error.response?.data || error.message);
      toast.error(
        error.response?.data?.message || 'Error deleting client. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={() => {}}>
      <AlertDialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this client? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteClient} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteClientConfirmation;
