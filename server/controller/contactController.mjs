// src/controller/contactController.mjs

import Contact from "../models/contactModel.mjs";
import Department from "../models/Department.mjs"; // For validating internal contacts

// Create a new contact
export const createContact = async (req, res) => {
  try {
    const {
      contactType,
      fullName,
      email,
      address,
      phone,
      department,
      company,
      contactPerson,
      externalEmail,
      externalPhone,
      externalAddress,
    } = req.body;

    if (!contactType || !["internal", "external"].includes(contactType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact type. Must be internal or external.",
      });
    }

    if (contactType === "internal") {
      if (!fullName || !email || !address || !phone || !department) {
        return res.status(400).json({
          success: false,
          message:
            "For internal contacts, fullName, email, address, phone, and department are required.",
        });
      }
      const dept = await Department.findById(department);
      if (!dept) {
        return res.status(404).json({
          success: false,
          message: "Department not found.",
        });
      }
    } else if (contactType === "external") {
      if (!company || !contactPerson || !externalEmail || !externalPhone || !externalAddress) {
        return res.status(400).json({
          success: false,
          message:
            "For external contacts, company, contactPerson, externalEmail, externalPhone, and externalAddress are required.",
        });
      }
    }

    const newContact = new Contact({
      contactType,
      ...(contactType === "internal" && { fullName, email, address, phone, department }),
      ...(contactType === "external" && { company, contactPerson, externalEmail, externalPhone, externalAddress }),
    });

    const savedContact = await newContact.save();
    res.status(201).json({
      success: true,
      message: "Contact created successfully.",
      data: savedContact,
    });
  } catch (error) {
    console.error("Error creating contact:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create contact.",
      error: error.message,
    });
  }
};

// Get all contacts (with pagination)
export const getAllContacts = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const contacts = await Contact.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("department", "name");

    const totalContacts = await Contact.countDocuments();

    res.status(200).json({
      success: true,
      contacts,
      totalPages: Math.ceil(totalContacts / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching contacts:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contacts.",
      error: error.message,
    });
  }
};

// Get a single contact by ID
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id).populate("department", "name");
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found.",
      });
    }
    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error fetching contact:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact.",
      error: error.message,
    });
  }
};

// Update a contact by ID
export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedContact = await Contact.findByIdAndUpdate(id, updateData, { new: true })
      .populate("department", "name");
    if (!updatedContact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found.",
      });
    }
    res.status(200).json({
      success: true,
      message: "Contact updated successfully.",
      data: updatedContact,
    });
  } catch (error) {
    console.error("Error updating contact:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update contact.",
      error: error.message,
    });
  }
};

// Delete a contact by ID
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedContact = await Contact.findByIdAndDelete(id);
    if (!deletedContact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found.",
      });
    }
    res.status(200).json({
      success: true,
      message: "Contact deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting contact:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact.",
      error: error.message,
    });
  }
};

// Bulk delete contacts
export const bulkDeleteContacts = async (req, res) => {
  try {
    const { contactIds } = req.body;
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A valid array of contact IDs is required.",
      });
    }
    await Contact.deleteMany({ _id: { $in: contactIds } });
    res.status(200).json({
      success: true,
      message: "Contacts deleted successfully.",
    });
  } catch (error) {
    console.error("Error bulk deleting contacts:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete contacts.",
      error: error.message,
    });
  }
};
