import Event from "../models/Event.mjs";
import User from "../models/User.mjs"; 
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import moment from "moment"; // for date manipulations

dotenv.config();

// Set up nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // This bypasses the certificate validation
  },
});

// 1) Create an event
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, color, type, notifyAdmins } = req.body;

    // Validate required fields
    if (!title || !date || !startTime || !endTime || !type) {
      return res.status(400).json({
        success: false,
        message: "Title, date, start time, end time, and type are required.",
      });
    }

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    if (startDateTime >= endDateTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time.",
      });
    }

    // Create the event
    const newEvent = new Event({
      title,
      description,
      date,
      startTime: startDateTime,
      endTime: endDateTime,
      color,
      type,
    });
    const savedEvent = await newEvent.save();

    // Send HTTP response immediately
    res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: savedEvent,
    });

    // Now process email notifications asynchronously (fire-and-forget)
    const usersQuery = notifyAdmins
      ? User.find({ role: "admin" })
      : User.find({ email: { $ne: null } });
    const users = await usersQuery;
    const emailAddresses = users.map((u) => u.email);

    if (emailAddresses.length > 0) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emailAddresses.join(", "),
        subject: `New Event: ${title}`,
        text: `New event scheduled on ${moment(date).format("YYYY-MM-DD")} from ${startDateTime.toLocaleTimeString()} to ${endDateTime.toLocaleTimeString()}.\n\nDescription:\n${description || "No description provided."}\n\nType: ${type}`,
      };

      // Fire-and-forget email sending without awaiting its result
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending emails:", error.message);
        } else {
          console.log("Emails sent successfully (createEvent):", info.response);
        }
      });
    }
  } catch (error) {
    console.error("Error creating event:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create event.",
      error: error.message,
    });
  }
};

// 2) Get all events
export const getAllEvents = async (req, res) => {
  const { date, type } = req.query;
  const filter = {};
  if (date) filter.date = date;
  if (type) filter.type = type;

  try {
    const events = await Event.find(filter).sort({ startTime: 1 });
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events.",
      error: error.message,
    });
  }
};

// 3) Get event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error("Error fetching event:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event.",
      error: error.message,
    });
  }
};

// 4) Update an event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, startTime, endTime, color, type } = req.body;

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    if (startDateTime >= endDateTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time.",
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        title,
        description,
        date,
        startTime: startDateTime,
        endTime: endDateTime,
        color,
        type,
      },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event updated successfully.",
      data: updatedEvent,
    });
  } catch (error) {
    console.error("Error updating event:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update event.",
      error: error.message,
    });
  }
};

// 5) Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Event deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting event:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete event.",
      error: error.message,
    });
  }
};

/* -----------------------------------------------
   6) Daily Email Reminder for Next-Day Events
-------------------------------------------------
   This function queries all events happening "tomorrow"
   and sends a reminder to relevant users.
   Typically called by a cron job or setInterval. 
*/
export const sendDailyEventReminders = async () => {
  try {
    // "Tomorrow" range
    const tomorrowStart = moment().add(1, "day").startOf("day").toDate();
    const tomorrowEnd = moment().add(1, "day").endOf("day").toDate();

    const events = await Event.find({
      startTime: { $gte: tomorrowStart, $lt: tomorrowEnd },
    });

    if (!events.length) {
      console.log("No events to remind for tomorrow.");
      return;
    }

    // Email all users (or adjust the query based on your notification requirements)
    const users = await User.find({ email: { $ne: null } });
    const emailAddresses = users.map((u) => u.email);

    for (const event of events) {
      const subject = `Reminder: ${event.title} is happening tomorrow!`;
      const text = `
Hello,

This is a reminder that the event "${event.title}" is scheduled for tomorrow, 
${moment(event.startTime).format("MMM Do, YYYY [at] h:mm A")} - 
${moment(event.endTime).format("h:mm A")}.

Description: ${event.description || "No description provided."}
Type: ${event.type}

Best regards,
TMS Team
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emailAddresses.join(", "),
        subject,
        text,
      };

      // Send each reminder asynchronously (fire-and-forget)
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error(`Failed to send reminder for event "${event.title}":`, err.message);
        } else {
          console.log(`Reminder email sent for event: ${event.title}`, info.response);
        }
      });
    }
  } catch (error) {
    console.error("Error in sendDailyEventReminders:", error.message);
  }
};
