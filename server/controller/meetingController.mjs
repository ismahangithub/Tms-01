// Import dependencies
import Meeting from "../models/Meeting.mjs";
import Department from "../models/Department.mjs";
import User from "../models/User.mjs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail", // Update based on your email service provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // This bypasses the certificate validation
  },
});

// Create a new meeting
export const createMeeting = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      departments,
      invitedUsers,
      agenda,
    } = req.body;

    // Validate required fields
    if (!title || !date || (!invitedUsers?.length && !departments?.length)) {
      return res.status(400).json({
        success: false,
        message:
          "Title, date, and either invited users or departments are required.",
      });
    }

    // Validate start and end times
    const formattedStartTime = new Date(`${date}T${startTime}`);
    const formattedEndTime = new Date(`${date}T${endTime}`);

    if (
      isNaN(formattedStartTime.getTime()) ||
      isNaN(formattedEndTime.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid start or end time.",
      });
    }

    if (formattedEndTime <= formattedStartTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time.",
      });
    }

    if (new Date(date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Meeting date cannot be in the past.",
      });
    }

    // Fetch users based on departments or invited users
    let usersToInvite = [];
    if (invitedUsers?.length > 0) {
      usersToInvite = await User.find({ _id: { $in: invitedUsers } });
    } else if (departments?.length > 0) {
      usersToInvite = await User.find({ department: { $in: departments } });
    }

    const emailAddresses = usersToInvite.map((user) => user.email);

    // Create the meeting
    const newMeeting = new Meeting({
      title,
      description,
      date,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      departments,
      invitedUsers: usersToInvite.map((user) => user._id),
      agenda,
      color: "#FF0000", // Red color for meetings
    });

    // Save the meeting first
    const savedMeeting = await newMeeting.save();

    // Send the HTTP response immediately without waiting for email sending
    res.status(201).json({
      success: true,
      message: "Meeting created successfully.",
      data: savedMeeting,
    });

    // Now, proceed to send email invitations asynchronously
    if (emailAddresses.length > 0) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emailAddresses.join(", "),
        subject: `Invitation to Meeting: ${title}`,
        text: `Dear Team,

You are invited to the meeting "${title}" scheduled on ${new Date(
          date
        ).toLocaleDateString()} from ${startTime} to ${endTime}.

Description:
${description || "No description provided."}

Agenda:
${agenda || "No agenda provided."}

Best regards,
Your Company`,
      };

      // Fire-and-forget without awaiting
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending emails:", error.message);
        } else {
          console.log("Emails sent: " + info.response);
        }
      });
    }
  } catch (error) {
    console.error("Error creating meeting:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create meeting.",
      error: error.message,
    });
  }
};

// Get all meetings with optional filtering
export const getAllMeetings = async (req, res) => {
  const { date, departmentId } = req.query;
  let filter = {};

  if (date) {
    filter.date = date;
  }
  if (departmentId) {
    filter.departments = departmentId;
  }

  try {
    const meetings = await Meeting.find(filter)
      .populate("departments", "name")
      .populate("invitedUsers", "firstName lastName email");

    res.status(200).json({
      success: true,
      data: meetings,
    });
  } catch (error) {
    console.error("Error fetching meetings:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch meetings.",
      error: error.message,
    });
  }
};

// Get a specific meeting by ID
export const getMeetingById = async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = await Meeting.findById(id)
      .populate("departments", "name")
      .populate("invitedUsers", "firstName lastName email");

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    console.error("Error fetching meeting:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch meeting.",
      error: error.message,
    });
  }
};

// Update a meeting
export const updateMeeting = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedMeeting = await Meeting.findByIdAndUpdate(id, req.body, {
      new: true,
    })
      .populate("departments", "name")
      .populate("invitedUsers", "firstName lastName email");

    if (!updatedMeeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Meeting updated successfully.",
      data: updatedMeeting,
    });
  } catch (error) {
    console.error("Error updating meeting:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update meeting.",
      error: error.message,
    });
  }
};

// Delete a meeting
export const deleteMeeting = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedMeeting = await Meeting.findByIdAndDelete(id);

    if (!deletedMeeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Meeting deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting meeting:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete meeting.",
      error: error.message,
    });
  }
};
