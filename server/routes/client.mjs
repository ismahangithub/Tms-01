// server/routes/clientRoutes.mjs

import express from "express";
import {
  createClient,
  getClients,
  updateClient,
  deleteClient,
} from "../controller/clientController.mjs";
import { isAdmin } from "../middleware/isAdmin.mjs"; // Assuming you have an admin middleware
// import { validateClientPayload } from "../middleware/validateClient.mjs"; // Assuming you have validation middleware

const router = express.Router();

// Create a new client
router.post("/", isAdmin, createClient);

// Get all clients or a single client by ID
router.get("/:id?", getClients);

// Update a client by ID
router.put("/:id", isAdmin, updateClient);

// Delete a client by ID
router.delete("/:id", isAdmin, deleteClient);

export default router;
