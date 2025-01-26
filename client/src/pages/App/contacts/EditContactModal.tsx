// src/pages/App/contacts/EditContactModal.tsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import Select from "react-select";
import axios from "axios";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTimes } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    _id: string;
    contactType: string;
    fullName?: string;
    email?: string;
    address?: string;
    phone: string;
    department?: { _id: string; name: string };
    company?: string;
    contactPerson?: string;
    externalEmail?: string;
    externalPhone?: string;
    externalAddress?: string;
  };
  onContactUpdated: () => void;
}

interface Option {
  value: string;
  label: string;
}

const EditContactModal: React.FC<EditContactModalProps> = ({
  isOpen,
  onClose,
  contact,
  onContactUpdated,
}) => {
  const [contactType] = useState<string>(contact.contactType); // Fixed from prop
  // For internal contacts
  const [fullName, setFullName] = useState(contact.fullName || "");
  const [internalEmail, setInternalEmail] = useState(contact.email || "");
  const [address, setAddress] = useState(contact.address || "");
  const [phone, setPhone] = useState(contact.phone);
  const [department, setDepartment] = useState<Option | null>(
    contact.department ? { value: contact.department._id, label: contact.department.name } : null
  );
  // For external contacts
  const [company, setCompany] = useState(contact.company || "");
  const [contactPerson, setContactPerson] = useState(contact.contactPerson || "");
  const [externalEmail, setExternalEmail] = useState(contact.externalEmail || "");
  const [externalPhone, setExternalPhone] = useState(contact.externalPhone || "");
  const [externalAddress, setExternalAddress] = useState(contact.externalAddress || "");
  const [loading, setLoading] = useState(false);
  const [departmentsOptions, setDepartmentsOptions] = useState<Option[]>([]);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  // Fetch department options if internal contact
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/departments`);
        if (Array.isArray(res.data)) {
          const options = res.data.map((dept: any) => ({
            value: dept._id,
            label: dept.name,
          }));
          setDepartmentsOptions(options);
        }
      } catch (error) {
        toast.error("Failed to load departments.");
      }
    };
    if (contactType === "internal") {
      fetchDepartments();
    }
  }, [contactType, API_URL]);

  useEffect(() => {
    // Update state if contact prop changes
    setFullName(contact.fullName || "");
    setInternalEmail(contact.email || "");
    setAddress(contact.address || "");
    setPhone(contact.phone);
    setDepartment(contact.department ? { value: contact.department._id, label: contact.department.name } : null);
    setCompany(contact.company || "");
    setContactPerson(contact.contactPerson || "");
    setExternalEmail(contact.externalEmail || "");
    setExternalPhone(contact.externalPhone || "");
    setExternalAddress(contact.externalAddress || "");
  }, [contact]);

  const handleSubmit = async () => {
    // Validate based on contact type
    if (contactType === "internal") {
      if (!fullName || !internalEmail || !address || !phone || !department) {
        toast.error("Please fill in all internal contact fields.");
        return;
      }
    } else {
      if (!company || !contactPerson || !externalEmail || !externalPhone || !externalAddress) {
        toast.error("Please fill in all external contact fields.");
        return;
      }
    }
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      navigate("/auth/login");
      return;
    }
    const updateData: any = { contactType };
    if (contactType === "internal") {
      Object.assign(updateData, {
        fullName,
        email: internalEmail,
        address,
        phone,
        department: department?.value,
      });
    } else {
      Object.assign(updateData, {
        company,
        contactPerson,
        externalEmail,
        externalPhone,
        externalAddress,
      });
    }
    try {
      setLoading(true);
      await axios.put(`${API_URL}/api/contacts/${contact._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Contact updated successfully!");
      onContactUpdated();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update contact.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl p-6 bg-white rounded-lg shadow-lg"
        style={{ minWidth: "700px", maxHeight: "75vh", overflowY: "auto" }}
      >
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl font-semibold text-[#006272] flex items-center gap-2">
            <FontAwesomeIcon icon={faEdit} /> Edit Contact
          </DialogTitle>
          {/* <Button variant="ghost" onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <FontAwesomeIcon icon={faTimes} />
          </Button> */}
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {/* Display fixed contact type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Type</label>
            <Input value={contactType} readOnly className="mt-1 bg-gray-100" />
          </div>
          {contactType === "internal" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <Input
                  value={internalEmail}
                  onChange={(e) => setInternalEmail(e.target.value)}
                  placeholder="Enter email"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter address"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <Select
                  options={departmentsOptions}
                  value={department}
                  onChange={(selected) => setDepartment(selected as Option)}
                  placeholder="Select department"
                  className="mt-1"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Enter company name"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Enter contact person"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <Input
                  value={externalEmail}
                  onChange={(e) => setExternalEmail(e.target.value)}
                  placeholder="Enter email"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <Input
                  value={externalPhone}
                  onChange={(e) => setExternalPhone(e.target.value)}
                  placeholder="Enter phone"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <Input
                  value={externalAddress}
                  onChange={(e) => setExternalAddress(e.target.value)}
                  placeholder="Enter address"
                  required
                  className="mt-1"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter className="mt-6 flex justify-end gap-3">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#006272] hover:bg-[#004f57] text-white px-4 py-2 flex items-center"
          >
            {loading ? "Updating..." : "Update Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditContactModal;
