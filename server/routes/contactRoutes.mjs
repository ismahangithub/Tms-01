// src/routes/contactRoutes.mjs

import express from "express";
import {
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  bulkDeleteContacts,
} from "../controller/contactController.mjs";

const router = express.Router();

// Create a new contact
router.post("/", createContact);

// Get all contacts (with optional pagination)
router.get("/", getAllContacts);

// Bulk delete contacts (use /bulk-delete to prevent route conflicts)
router.delete("/bulk-delete", bulkDeleteContacts);

// Get a contact by ID
router.get("/:id", getContactById);

// Update a contact by ID
router.put("/:id", updateContact);

// Delete a contact by ID
router.delete("/:id", deleteContact);

export default router;
