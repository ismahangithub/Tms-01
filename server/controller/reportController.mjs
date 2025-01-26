import Report from "../models/reportModel.mjs";
import Project from "../models/Project Model.mjs";
import Task from "../models/task.mjs";
import Client from "../models/client.mjs";
import Department from "../models/Department.mjs";
import User from "../models/User.mjs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Set up nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 1) Create a new report
export const createReport = async (req, res) => {
  try {
    const {
      title,
      content,
      project,
      client,
      department,
      task,
      user,
      scope,
      emailRecipients,
      createdBy,
    } = req.body;

    // Validation: Check required fields
    if (!title || !content || !scope || !createdBy) {
      return res
        .status(400)
        .json({ error: "Title, content, scope, and createdBy are required." });
    }

    // Ensure one linked entity is provided
    if (!(project || client || department || task || user)) {
      return res.status(400).json({
        error:
          "At least one linked entity (project, client, department, task, or user) is required.",
      });
    }

    // Scope-specific validations
    if (scope === "client" && !client) {
      return res
        .status(400)
        .json({ error: "Client must be specified for client reports." });
    }
    if (scope === "department" && !department) {
      return res.status(400).json({
        error: "Department must be specified for department reports.",
      });
    }

    // Verify if linked client or department exists
    if (scope === "client") {
      const clientExists = await Client.findById(client);
      if (!clientExists) {
        return res.status(404).json({ error: "Client not found." });
      }
    }
    if (scope === "department") {
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(404).json({ error: "Department not found." });
      }
    }

    // Create new report
    const newReport = new Report({
      title,
      content,
      project,
      client,
      department,
      task,
      user,
      scope,
      createdBy,
      emailRecipients,
    });

    // Save the report and send the HTTP response immediately
    const savedReport = await newReport.save();
    res.status(201).json(savedReport);

    // Now, process email notifications asynchronously (fire-and-forget)
    if (emailRecipients && emailRecipients.length > 0) {
      sendEmailReport(savedReport, emailRecipients);
    }
  } catch (error) {
    console.error("Error creating report:", error.message || error);
    res.status(500).json({
      error: "Failed to create report. Please try again later.",
    });
  }
};

// Send report via email (fire-and-forget)
const sendEmailReport = (report, recipients) => {
  const mailOptions = {
    from: "TMS Reports <noreply@tms.com>",
    to: recipients.join(", "),
    subject: `Report: ${report.title}`,
    html: `<h3>${report.title}</h3><p>${report.content}</p>`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Failed to send email:", err.message || err);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

// 2) Get all reports with pagination
export const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reports = await Report.find()
      .populate("createdBy", "firstName lastName email")
      .populate("project", "name")
      .populate("client", "name")
      .populate("department", "name")
      .populate("task", "name")
      .populate("user", "firstName lastName")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalReports = await Report.countDocuments();

    res.json({
      reports,
      totalPages: Math.ceil(totalReports / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Error fetching reports:", error.message || error);
    res.status(500).json({ error: "Failed to fetch reports." });
  }
};

// 3) Get a single report by ID
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("createdBy", "firstName lastName email")
      .populate("project", "name")
      .populate("client", "name")
      .populate("department", "name")
      .populate("task", "name")
      .populate("user", "firstName lastName");

    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }
    res.json(report);
  } catch (error) {
    console.error("Error fetching report:", error.message || error);
    res.status(500).json({ error: "Failed to fetch report." });
  }
};

// 4) Update an existing report
export const updateReport = async (req, res) => {
  try {
    const {
      title,
      content,
      project,
      client,
      department,
      task,
      user,
      scope,
      emailRecipients,
    } = req.body;

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        project,
        client,
        department,
        task,
        user,
        scope,
        emailRecipients,
      },
      { new: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ error: "Report not found." });
    }

    res.json(updatedReport);
  } catch (error) {
    console.error("Error updating report:", error.message || error);
    res.status(500).json({ error: "Failed to update report." });
  }
};

// 5) Delete a report
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }

    res.json({ message: "Report deleted successfully." });
  } catch (error) {
    console.error("Error deleting report:", error.message || error);
    res.status(500).json({ error: "Failed to delete report." });
  }
};
