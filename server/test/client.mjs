import { Router } from "express";
import {
  createClient,
  getClients,
  updateClient,
  deleteClient,
} from "../controller/clientController.mjs";
import { validateClient } from "../middleware/clientValidations.mjs";
import { isAdmin } from "../middleware/isAdmin.mjs"; // Role-based authorization middleware

const router = Router();

// Middleware to log requests (optional, for debugging)
router.use((req, res, next) => {
  console.log(`Client Route -> ${req.method}: ${req.originalUrl}`);
  next();
});

// Create a new client (Admin-only)
router.post("/", isAdmin, validateClient, createClient);

// Fetch all clients or a specific client by ID
router.get("/:id?", getClients);

// Update an existing client by ID (Admin-only)
router.put("/:id", isAdmin, validateClient, updateClient);

// Delete a client by ID (Admin-only)
router.delete("/:id", isAdmin, deleteClient);

export default router;
