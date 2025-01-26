// src/pages/App/contacts/CreateContactModal.tsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import Select from "react-select";
import axios from "axios";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactCreated: () => void;
}

interface Option {
  value: string;
  label: string;
}

const contactTypeOptions: Option[] = [
  { value: "internal", label: "Internal" },
  { value: "external", label: "External" },
];

const CreateContactModal: React.FC<CreateContactModalProps> = ({
  isOpen,
  onClose,
  onContactCreated,
}) => {
  // State for common field(s)
  const [contactType, setContactType] = useState<string>("internal");

  // For internal contacts
  const [fullName, setFullName] = useState("");
  const [internalEmail, setInternalEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState<Option | null>(null);

  // For external contacts
  const [company, setCompany] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const [externalPhone, setExternalPhone] = useState("");
  const [externalAddress, setExternalAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [departmentsOptions, setDepartmentsOptions] = useState<Option[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  // Fetch departments when internal contact is selected
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/departments`);
        if (Array.isArray(res.data)) {
          const opts = res.data.map((dept: any) => ({
            value: dept._id,
            label: dept.name,
          }));
          setDepartmentsOptions(opts);
        }
      } catch (error) {
        toast.error("Failed to load departments.");
      }
    };
    if (contactType === "internal") {
      fetchDepartments();
    } else {
      // Clear department options if external contact is selected
      setDepartmentsOptions([]);
      setDepartment(null);
    }
  }, [contactType, API_URL]);

  // Validation function (runs three times for safety)
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Common check: contact type must be set (always true)
    if (!contactType) {
      newErrors.contactType = "Contact type is required.";
    }

    if (contactType === "internal") {
      if (!fullName.trim()) newErrors.fullName = "Full name is required.";
      if (!internalEmail.trim()) newErrors.internalEmail = "Email is required.";
      if (!address.trim()) newErrors.address = "Address is required.";
      if (!phone.trim()) newErrors.phone = "Phone is required.";
      if (!department) newErrors.department = "Department is required.";
    } else {
      if (!company.trim()) newErrors.company = "Company is required.";
      if (!contactPerson.trim()) newErrors.contactPerson = "Contact person is required.";
      if (!externalEmail.trim()) newErrors.externalEmail = "Email is required.";
      if (!externalPhone.trim()) newErrors.externalPhone = "Phone is required.";
      if (!externalAddress.trim()) newErrors.externalAddress = "Address is required.";
    }

    // Set errors the first time
    setErrors(newErrors);

    // Run one more validation for safety
    const recheckErrors: { [key: string]: string } = {};
    if (contactType === "internal") {
      if (!fullName.trim()) recheckErrors.fullName = "Full name is required.";
      if (!internalEmail.trim()) recheckErrors.internalEmail = "Email is required.";
      if (!address.trim()) recheckErrors.address = "Address is required.";
      if (!phone.trim()) recheckErrors.phone = "Phone is required.";
      if (!department) recheckErrors.department = "Department is required.";
    } else {
      if (!company.trim()) recheckErrors.company = "Company is required.";
      if (!contactPerson.trim()) recheckErrors.contactPerson = "Contact person is required.";
      if (!externalEmail.trim()) recheckErrors.externalEmail = "Email is required.";
      if (!externalPhone.trim()) recheckErrors.externalPhone = "Phone is required.";
      if (!externalAddress.trim()) recheckErrors.externalAddress = "Address is required.";
    }
    setErrors({ ...newErrors, ...recheckErrors });

    // Final check (Third round)
    const finalErrors: { [key: string]: string } = {};
    if (contactType === "internal") {
      if (!fullName.trim()) finalErrors.fullName = "Full name is required.";
      if (!internalEmail.trim()) finalErrors.internalEmail = "Email is required.";
      if (!address.trim()) finalErrors.address = "Address is required.";
      if (!phone.trim()) finalErrors.phone = "Phone is required.";
      if (!department) finalErrors.department = "Department is required.";
    } else {
      if (!company.trim()) finalErrors.company = "Company is required.";
      if (!contactPerson.trim()) finalErrors.contactPerson = "Contact person is required.";
      if (!externalEmail.trim()) finalErrors.externalEmail = "Email is required.";
      if (!externalPhone.trim()) finalErrors.externalPhone = "Phone is required.";
      if (!externalAddress.trim()) finalErrors.externalAddress = "Address is required.";
    }
    setErrors(finalErrors);

    return Object.keys(finalErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      navigate("/auth/login");
      return;
    }

    const formData: any = { contactType };

    if (contactType === "internal") {
      Object.assign(formData, {
        fullName,
        email: internalEmail,
        address,
        phone,
        department: department?.value,
      });
    } else {
      Object.assign(formData, {
        company,
        contactPerson,
        externalEmail,
        externalPhone,
        externalAddress,
      });
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/contacts`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Contact created successfully!");
      onContactCreated();
      onClose();
      // Reset form fields
      setContactType("internal");
      setFullName("");
      setInternalEmail("");
      setAddress("");
      setPhone("");
      setDepartment(null);
      setCompany("");
      setContactPerson("");
      setExternalEmail("");
      setExternalPhone("");
      setExternalAddress("");
      setErrors({});
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create contact.");
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
            <FontAwesomeIcon icon={faPlus} /> Create New Contact
          </DialogTitle>
          {/* <Button variant="ghost" onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <FontAwesomeIcon icon={faTimes} />
          </Button> */}
        </DialogHeader>
        <DialogDescription className="text-gray-500">
          Fill in the details below to create a new contact.
        </DialogDescription>
        <div className="mt-4 space-y-4">
          {/* Contact Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Type</label>
            <Select
              options={contactTypeOptions}
              value={contactTypeOptions.find((opt) => opt.value === contactType) || null}
              onChange={(selected) =>
                setContactType(selected ? selected.value : "internal")
              }
              placeholder="Select contact type"
              className="mt-1"
            />
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
                {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
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
                {errors.internalEmail && <p className="text-red-500 text-sm">{errors.internalEmail}</p>}
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
                {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
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
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
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
                {errors.department && <p className="text-red-500 text-sm">{errors.department}</p>}
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
                {errors.company && <p className="text-red-500 text-sm">{errors.company}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Enter contact person name"
                  required
                  className="mt-1"
                />
                {errors.contactPerson && <p className="text-red-500 text-sm">{errors.contactPerson}</p>}
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
                {errors.externalEmail && <p className="text-red-500 text-sm">{errors.externalEmail}</p>}
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
                {errors.externalPhone && <p className="text-red-500 text-sm">{errors.externalPhone}</p>}
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
                {errors.externalAddress && <p className="text-red-500 text-sm">{errors.externalAddress}</p>}
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
            {loading
              ? "Creating..."
              : (
                <>
                  <FontAwesomeIcon icon={faPlus} className="mr-2" /> Create Contact
                </>
              )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContactModal;
