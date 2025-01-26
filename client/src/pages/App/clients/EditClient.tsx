import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import toast from "react-hot-toast";
import axios from "axios";

interface Client {
  _id?: string;
  name: string;
  email: string;
  address: string;
  phoneNumberOne: string;
  phoneNumberTwo?: string; // Optional
}

interface EditClientModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onClientUpdated: (updatedClient: Client) => void; // Updated prop name
}

const EditClientModal: React.FC<EditClientModalProps> = ({
  client,
  isOpen,
  onClose,
  onClientUpdated,
}) => {
  const [updatedClient, setUpdatedClient] = useState<Client>({ ...client });

  useEffect(() => {
    if (client) {
      setUpdatedClient({ ...client });
    }
  }, [client]);

  const handleSaveChanges = async () => {
    console.log("Updated Client Data: ", updatedClient); // Debugging

    try {
      const response = await axios.put(`/api/clients/${updatedClient._id}`, updatedClient);
      onClientUpdated(response.data); // Use onClientUpdated instead of onClientEdited
      toast.success("Client updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[800px] max-w-full">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Name */}
          <div className="col-span-2">
            <label className="block text-base font-semibold mb-2">
              Name<span className="text-red-500">*</span>
            </label>
            <Input
              className="w-full text-lg p-2"
              value={updatedClient.name}
              onChange={(e) =>
                setUpdatedClient({ ...updatedClient, name: e.target.value })
              }
              placeholder="Enter client name"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-base font-semibold mb-2">
              Email<span className="text-red-500">*</span>
            </label>
            <Input
              className="w-full text-lg p-2"
              type="email"
              value={updatedClient.email}
              onChange={(e) =>
                setUpdatedClient({ ...updatedClient, email: e.target.value })
              }
              placeholder="Enter client email"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-base font-semibold mb-2">
              Address<span className="text-red-500">*</span>
            </label>
            <Input
              className="w-full text-lg p-2"
              value={updatedClient.address}
              onChange={(e) =>
                setUpdatedClient({ ...updatedClient, address: e.target.value })
              }
              placeholder="Enter client address"
              required
            />
          </div>

          {/* Phone Number One */}
          <div>
            <label className="block text-base font-semibold mb-2">
              Phone Number 1<span className="text-red-500">*</span>
            </label>
            <Input
              className="w-full text-lg p-2"
              type="tel"
              value={updatedClient.phoneNumberOne}
              onChange={(e) =>
                setUpdatedClient({ ...updatedClient, phoneNumberOne: e.target.value })
              }
              placeholder="Enter primary phone number"
              required
            />
          </div>

          {/* Phone Number Two */}
          <div>
            <label className="block text-base font-semibold mb-2">
              Phone Number 2
            </label>
            <Input
              className="w-full text-lg p-2"
              type="tel"
              value={updatedClient.phoneNumberTwo || ""}
              onChange={(e) =>
                setUpdatedClient({ ...updatedClient, phoneNumberTwo: e.target.value })
              }
              placeholder="Enter secondary phone number (optional)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="text-lg px-4 py-2"
            onClick={() => {
              onClose();
              // Optional: navigate("/clients") if you want to ensure the page reloads after close
            }}
          >
            Cancel
          </Button>
          <Button
            className="text-lg px-4 py-2 bg-blue-500 text-white"
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientModal;
