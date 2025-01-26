// import moment from "moment";
// import Project from "../models/Project Model.mjs";
// import User from "../models/user.mjs";
// import Client from "../models/client.mjs";
// import Department from "../models/Department.mjs";
// import mongoose from "mongoose";

// export const createProject = async (req, res) => {
//   try {
//     const {
//       name,
//       client,
//       department,
//       members,
//       startDate,
//       dueDate,
//       projectBudget,
//       status,
//       progress,
//     } = req.body;

//     // Validate `client`, `department`, and `members`
//     if (!mongoose.Types.ObjectId.isValid(client)) {
//       return res.status(400).json({ message: "Invalid client ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(department)) {
//       return res.status(400).json({ message: "Invalid department ID" });
//     }
//     if (!Array.isArray(members) || members.length === 0) {
//       return res.status(400).json({ message: "At least one member must be assigned to the project" });
//     }
//     const invalidMember = members.find((member) => !mongoose.Types.ObjectId.isValid(member));
//     if (invalidMember) {
//       return res.status(400).json({ message: `Invalid member ID: ${invalidMember}` });
//     }

//     // Ensure `dueDate` is greater than `startDate`
//     if (new Date(dueDate) <= new Date(startDate)) {
//       return res.status(400).json({ message: "Due date must be after the start date" });
//     }

//     // Create the project
//     const project = new Project({
//       name,
//       client,
//       department,
//       members,
//       startDate,
//       dueDate,
//       projectBudget: projectBudget || 0,
//       status: status || "pending",
//       progress: progress || 0,
//     });

//     await project.save();
//     res.status(201).json({ message: "Project created successfully", project });
//   } catch (error) {
//     console.error("Error creating project:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// export const getProjects = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, department } = req.query;

//     const query = {};
//     if (status) query.status = status; // Filter by status
//     if (department) query.department = department; // Filter by department

//     // If ID is provided, fetch a single project
//     if (id) {
//       const project = await Project.findById(id)
//         .populate("client")
//         .populate("department")
//         .populate("members")
//         .populate("tasks");

//       if (!project) {
//         return res.status(404).json({ message: "Project not found" });
//       }
//       return res.status(200).json(project);
//     }

//     // If no ID, fetch all projects with filters
//     const projects = await Project.find(query)
//       .populate("client")
//       .populate("department")
//       .populate("members")
//       .populate("tasks");

//     res.status(200).json(projects);
//   } catch (error) {
//     console.error("Error fetching projects:", error.message);
//     res.status(500).json({ message: "Error fetching projects", error: error.message });
//   }
// };

// // export const getProjects = async (req, res) => {
// //   try {
// //     console.log("Request received for /api/projects with query:", req.query);
// //     const projects = await Project.find()
// //       .populate("client")
// //       .populate("department")
// //       .populate("members")
// //       .populate("tasks");
// //     console.log("Projects fetched:", projects.length);
// //     res.status(200).json(projects);
// //   } catch (error) {
// //     console.error("Error in getProjects:", error.message);
// //     res.status(500).json({ message: "Error fetching projects" });
// //   }
// // };




// export const updateProject = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       client,
//       department,
//       members,
//       startDate,
//       dueDate,
//       projectBudget,
//       ...otherFields
//     } = req.body;

//     // Validate `client` and `department` if provided
//     if (client && !mongoose.Types.ObjectId.isValid(client)) {
//       return res.status(400).json({ message: "Invalid client ID" });
//     }
//     if (department && !mongoose.Types.ObjectId.isValid(department)) {
//       return res.status(400).json({ message: "Invalid department ID" });
//     }

//     // Validate `members` if provided
//     if (members && !Array.isArray(members)) {
//       return res.status(400).json({ message: "Members must be an array" });
//     }
//     if (members) {
//       const invalidMember = members.find((member) => !mongoose.Types.ObjectId.isValid(member));
//       if (invalidMember) {
//         return res.status(400).json({ message: `Invalid member ID: ${invalidMember}` });
//       }
//     }

//     // Validate `dueDate` is after `startDate`
//     if (startDate && dueDate && new Date(dueDate) <= new Date(startDate)) {
//       return res.status(400).json({ message: "Due date must be after the start date" });
//     }

//     // Update project
//     const updateData = {
//       client,
//       department,
//       members,
//       startDate,
//       dueDate,
//       projectBudget,
//       ...otherFields,
//     };

//     const updatedProject = await Project.findByIdAndUpdate(id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     if (!updatedProject) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     res.status(200).json({ message: "Project updated successfully", updatedProject });
//   } catch (error) {
//     console.error("Error updating project:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// export const deleteProject = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const deletedProject = await Project.findByIdAndDelete(id);
//     if (!deletedProject) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     res.status(200).json({ message: "Project deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting project:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };


import moment from "moment";
import Project from "../models/Project Model.mjs";
import User from "../models/user.mjs";
import Client from "../models/client.mjs";
import Department from "../models/Department.mjs";
import mongoose from "mongoose";

// Create Project
export const createProject = async (req, res) => {
  try {
    const {
      name,
      client,
      department,
      members,
      startDate,
      dueDate,
      projectBudget,
      status,
      progress,
    } = req.body;

    console.log("Request Body:", req.body); // Debugging Log

    // Validate `client`, `department`, and `members`
    if (!mongoose.Types.ObjectId.isValid(client)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(department)) {
      return res.status(400).json({ message: "Invalid department ID" });
    }
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "At least one member must be assigned to the project" });
    }
    const invalidMember = members.find((member) => !mongoose.Types.ObjectId.isValid(member));
    if (invalidMember) {
      return res.status(400).json({ message: `Invalid member ID: ${invalidMember}` });
    }

    // Ensure `dueDate` is greater than `startDate`
    if (new Date(dueDate) <= new Date(startDate)) {
      return res.status(400).json({ message: "Due date must be after the start date" });
    }

    // Create the project
    const project = new Project({
      name,
      client,
      department,
      members,
      startDate,
      dueDate,
      projectBudget: projectBudget || 0,
      status: status || "pending",
      progress: progress || 0,
    });

    await project.save();
    res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    console.error("Error creating project:", error); // Debugging Log
    res.status(500).json({ message: "Server error", error });
  }
};

// Get Projects
export const getProjects = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, department } = req.query;

    console.log("Fetching projects with filters:", req.query); // Debugging Log

    const query = {};
    if (status) query.status = { $in: Array.isArray(status) ? status : [status] };
    if (department) query.department = department;

    if (id) {
      const project = await Project.findById(id)
        .populate("client")
        .populate("department")
        .populate("members")
        .populate("tasks");
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      return res.status(200).json(project);
    }

    const projects = await Project.find(query)
      .populate("client")
      .populate("department")
      .populate("members")
      .populate("tasks");

    console.log("Projects found:", projects); // Debugging Log
    return res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error.message); // Debugging Log
    res.status(500).json({ message: "Error fetching projects", error: error.message });
  }
};


// Update Project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client,
      department,
      members,
      startDate,
      dueDate,
      projectBudget,
      ...otherFields
    } = req.body;

    console.log("Updating project with data:", req.body); // Debugging Log

    // Validate `client` and `department` if provided
    if (client && !mongoose.Types.ObjectId.isValid(client)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }
    if (department && !mongoose.Types.ObjectId.isValid(department)) {
      return res.status(400).json({ message: "Invalid department ID" });
    }

    // Validate `members` if provided
    if (members && !Array.isArray(members)) {
      return res.status(400).json({ message: "Members must be an array" });
    }
    if (members) {
      const invalidMember = members.find((member) => !mongoose.Types.ObjectId.isValid(member));
      if (invalidMember) {
        return res.status(400).json({ message: `Invalid member ID: ${invalidMember}` });
      }
    }

    // Validate `dueDate` is after `startDate`
    if (startDate && dueDate && new Date(dueDate) <= new Date(startDate)) {
      return res.status(400).json({ message: "Due date must be after the start date" });
    }

    // Update project
    const updateData = {
      client,
      department,
      members,
      startDate,
      dueDate,
      projectBudget,
      ...otherFields,
    };

    const updatedProject = await Project.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project updated successfully", updatedProject });
  } catch (error) {
    console.error("Error updating project:", error); // Debugging Log
    res.status(500).json({ message: "Server error", error });
  }
};

// Delete Project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Deleting project:", id); // Debugging Log

    const deletedProject = await Project.findByIdAndDelete(id);
    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error); // Debugging Log
    res.status(500).json({ message: "Server error", error });
  }
};
