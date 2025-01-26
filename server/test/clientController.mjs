import Client from "../models/client.mjs";
import mongoose from "mongoose";

// Create a client
export const createClient = async (request, response) => {
  try {
    const { name, email, address, phoneNumberOne } = request.body;

    // Check if client already exists
    const isClient = await Client.findOne({ email: email.toLowerCase() });
    if (isClient) {
      return response.status(400).json({ message: "Client already exists" });
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
    response.status(201).json({ message: "Client created successfully", client });
  } catch (error) {
    console.error(`Error while creating the client: ${error}`);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return response.status(400).json({ message: messages.join(" ") });
    }
    return response.status(500).json({ message: "An error occurred during registration." });
  }
};

// Get all clients or a single client by ID
export const getClients = async (request, response) => {
  try {
    const { id } = request.params;

    // Validate ObjectId
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return response.status(400).json({ message: "Invalid client ID" });
    }

    const clients = id ? await Client.findById(id) : await Client.find({});
    if (!clients) {
      return response.status(404).json({ message: "Client not found" });
    }

    response.status(200).json(clients);
  } catch (error) {
    console.error(`Error while retrieving the clients: ${error}`);
    return response.status(500).json({ message: "An error occurred while retrieving clients." });
  }
};

// Update a client by ID
export const updateClient = async (request, response) => {
  try {
    const { id } = request.params;
    const { name, email, address, phoneNumberOne } = request.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.status(400).json({ message: "Invalid client ID" });
    }

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { name, email, address, phoneNumberOne },
      { new: true, runValidators: true } // Run schema validation
    );

    if (!updatedClient) {
      return response.status(404).json({ message: "Client not found" });
    }

    response.status(200).json({ message: "Client updated successfully", updatedClient });
  } catch (error) {
    console.error(`Error while updating the client: ${error}`);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return response.status(400).json({ message: messages.join(" ") });
    }
    return response.status(500).json({ message: "An error occurred while updating the client." });
  }
};

// Delete a client by ID
export const deleteClient = async (request, response) => {
  try {
    const { id } = request.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.status(400).json({ message: "Invalid client ID" });
    }

    const deletedClient = await Client.findByIdAndDelete(id);
    if (!deletedClient) {
      return response.status(404).json({ message: "Client not found" });
    }

    console.log(`Client with ID ${id} deleted successfully.`);
    response.status(200).json({ message: "Client deleted successfully", clientId: id });
  } catch (error) {
    console.error(`Error while deleting the client: ${error}`);
    return response.status(500).json({ message: "An error occurred while deleting the client." });
  }
};
