// server/controllers/clientController.mjs

import mongoose from "mongoose";
import Client from "../models/Client.mjs"; // Corrected import path and filename

/**
 * Create a client
 */
export const createClient = async (req, res) => {
  try {
    const { name, email, address, phoneNumberOne } = req.body;

    // Validate required fields
    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json({ message: "Client name is required and must be a string." });
    }
    if (!email || typeof email !== "string") {
      return res
        .status(400)
        .json({ message: "Valid email is required." });
    }

    // Check if client already exists
    const isClient = await Client.findOne({ email: email.toLowerCase() });
    if (isClient) {
      return res.status(400).json({ message: "Client already exists" });
    }

    // Create a new client
    const client = new Client({
      name,
      email,
      address,
      phoneNumberOne,
    });

    // Save the client
    await client.save();
    res.status(201).json({ message: "Client created successfully", client });
  } catch (error) {
    console.error(`Error while creating the client: ${error}`);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(" ") });
    }
    return res.status(500).json({ message: "An error occurred during registration." });
  }
};

/**
 * Get all clients or a single client by ID
 */
export const getClients = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }

    const clients = id ? await Client.findById(id) : await Client.find({});
    if (!clients) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json(clients);
  } catch (error) {
    console.error(`Error while retrieving the clients: ${error}`);
    return res.status(500).json({ message: "An error occurred while retrieving clients." });
  }
};

/**
 * Update a client by ID
 */
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, phoneNumberOne } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }

    // Validate fields if they are being updated
    const updateFields = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ message: "Invalid client name." });
      }
      updateFields.name = name;
    }
    if (email !== undefined) {
      if (typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({ message: "Invalid client email." });
      }
      updateFields.email = email.toLowerCase();
    }
    if (address !== undefined) {
      if (typeof address !== "string") {
        return res.status(400).json({ message: "Invalid client address." });
      }
      updateFields.address = address;
    }
    if (phoneNumberOne !== undefined) {
      if (typeof phoneNumberOne !== "string") {
        return res.status(400).json({ message: "Invalid phone number." });
      }
      updateFields.phoneNumberOne = phoneNumberOne;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update." });
    }

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true } // Run schema validation
    );

    if (!updatedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json({ message: "Client updated successfully", updatedClient });
  } catch (error) {
    console.error(`Error while updating the client: ${error}`);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(" ") });
    }
    return res.status(500).json({ message: "An error occurred while updating the client." });
  }
};

/**
 * Delete a client by ID
 */
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }

    const deletedClient = await Client.findByIdAndDelete(id);
    if (!deletedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    console.log(`Client with ID ${id} deleted successfully.`);
    res.status(200).json({ message: "Client deleted successfully", clientId: id });
  } catch (error) {
    console.error(`Error while deleting the client: ${error}`);
    return res.status(500).json({ message: "An error occurred while deleting the client." });
  }
};

/**
 * Fetch client details by project ID
 */
export const getClientByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const client = await Client.findOne({ projectId }).populate("client");
    if (!client) {
      return res.status(404).json({ message: "Client for the specified project not found" });
    }

    res.status(200).json(client); // Sends the client details
  } catch (error) {
    console.error("Error fetching client for project:", error);
    return res.status(500).json({ message: "An error occurred while fetching the client." });
  }
};
