// src/controllers/meetingController.mjs

import Meeting from "../models/Meeting.mjs";
import Department from "../models/Department.mjs";
import User from "../models/user.mjs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Specify the email service
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  logger: process.env.NODE_ENV !== "production",
  debug: process.env.NODE_ENV !== "production",
  tls: {
    rejectUnauthorized: false,
  },
});

// Create a new meeting
export const createMeeting = async (req, res) => {
  try {
    const { title, description, date, departments, invitedUsers, agenda } = req.body;

    // Validate required fields
    if (!title || !date || !departments || departments.length === 0) {
      return res.status(400).json({ message: "Title, date, and at least one department are required." });
    }

    // Fetch users from selected departments if invitedUsers is not provided
    let usersToInvite = [];

    if (invitedUsers && invitedUsers.length > 0) {
      // Fetch specific users
      usersToInvite = await User.find({ _id: { $in: invitedUsers } });
    } else {
      // Invite all users in the selected departments
      usersToInvite = await User.find({ department: { $in: departments } });
    }

    // Extract email addresses
    const emailAddresses = usersToInvite.map((user) => user.email);

    // Create the meeting
    const newMeeting = new Meeting({
      title,
      description,
      date,
      departments,
      invitedUsers: usersToInvite.map((user) => user._id),
      agenda,
    });

    const savedMeeting = await newMeeting.save();

    // Send email invitations
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailAddresses, // List of recipients
      subject: `Invitation to Meeting: ${title}`,
      text: `Dear Team,

You are invited to the meeting "${title}" scheduled on ${new Date(date).toLocaleString()}.

Description:
${description || "No description provided."}

Agenda:
${agenda || "No agenda provided."}

Please confirm your attendance.

Best regards,
Your Company`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending emails:", error);
        // Optionally, you can decide whether to fail the request or continue
        // Here, we'll continue and notify the client
        return res.status(500).json({ message: "Meeting created, but failed to send email invitations." });
      } else {
        console.log("Emails sent: " + info.response);
        return res.status(201).json({ message: "Meeting created and invitations sent successfully.", meeting: savedMeeting });
      }
    });
  } catch (error) {
    console.error("Error creating meeting:", error.message);
    res.status(500).json({ message: "Failed to create meeting." });
  }
};

// Get all meetings
export const getAllMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate("departments", "name")
      .populate("invitedUsers", "firstName lastName email");
    res.status(200).json(meetings);
  } catch (error) {
    console.error("Error fetching meetings:", error.message);
    res.status(500).json({ message: "Failed to fetch meetings." });
  }
};
