import nodemailer from "nodemailer";
import { EMAIL_PASS, EMAIL_USER } from "../configs/config.mjs";

// Configure transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
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

// Utility function to send emails
const sendEmail = async (options) => {
  try {
    const info = await transporter.sendMail({
      from: `"TMS Notifications" <${EMAIL_USER}>`,
      ...options,
    });
    console.log(`Email sent successfully: ${info.response}`);
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    if (error.response) {
      console.error(`SMTP response: ${error.response}`);
    }
  }
};

// 1. Welcome Email
export const sendWelcomeEmail = async (to, firstName, email, password) => {
  const subject = "Welcome to TMS!";
  const text = `Hello ${firstName},\n\nWelcome to the Task Management System (TMS)! Here are your login credentials:\n\nEmail: ${email}\nPassword: ${password}\n\nPlease log in and change your password.\n\nBest regards,\nTMS Team`;

  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send welcome email to ${to}: ${error.message}`);
  }
};

// 2. Task Assignment Email
export const sendAssignmentEmail = async (to, taskTitle, dueDate) => {
  const subject = "New Task Assigned!";
  const text = `Hello,\n\nYou have been assigned a task: "${taskTitle}".\nPlease complete it by ${moment(dueDate).format("MMMM Do YYYY")}\n\nBest regards,\nTMS Team`;

  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send assignment email to ${to}: ${error.message}`);
  }
};

// 3. Task Reminder Email
export const sendReminderEmail = async (to, taskTitle, hoursRemaining) => {
  const subject = "Task Reminder";
  const text = `Hello,\n\nThis is a reminder for your task: "${taskTitle}".\nYou have ${hoursRemaining} hours left to complete it.\n\nBest regards,\nTMS Team`;

  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send reminder email to ${to}: ${error.message}`);
  }
};

// 4. Overdue Task Alert
export const sendOverdueEmail = async (to, taskTitle, dueDate) => {
  const subject = "Overdue Task Alert";
  const text = `Hello,\n\nThe task "${taskTitle}" was due on ${moment(dueDate).format("MMMM Do YYYY")} and is now overdue.\nPlease address this as soon as possible.\n\nBest regards,\nTMS Team`;

  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send overdue email to ${to}: ${error.message}`);
  }
};

// 5. Project Completion Notification
export const sendProjectCompletionEmail = async (to, projectName) => {
  const subject = "Project Completed!";
  const text = `Hello,\n\nCongratulations! The project "${projectName}" has been successfully completed.\n\nBest regards,\nTMS Team`;

  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send project completion email to ${to}: ${error.message}`);
  }
};

// 6. Project Overdue Alert
export const sendProjectOverdueEmail = async (to, projectName, dueDate) => {
  const subject = "Overdue Project Alert";
  const text = `Hello,\n\nThe project "${projectName}" was due on ${moment(dueDate).format("MMMM Do YYYY")} and is now overdue.\nPlease review and take necessary actions.\n\nBest regards,\nTMS Team`;

  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send project overdue email to ${to}: ${error.message}`);
  }
};

// 7. Weekly/Monthly Report
export const sendReportEmail = async (to, reportType, reportData) => {
  const subject = `${reportType} Report`;
  const text = `Hello,\n\nHere is your ${reportType} report:\n\n${reportData}\n\nBest regards,\nTMS Team`;

  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send report email to ${to}: ${error.message}`);
  }
};
export const sendDepartmentChangeNotification = async (
  recipients,
  firstName,
  lastName,
  email,
  role,
  departmentId
) => {
  const subject = "Department Update Notification";
  const text = `Hello,\n\nWe wanted to inform you that ${firstName} ${lastName} (${email}) has been added to your department.\n\nRole: ${role}\n\nBest regards,\nTMS Team`;

  try {
    for (const recipient of recipients) {
      await sendEmail({ to: recipient, subject, text });
    }
    console.log(`Department change notification emails sent to ${recipients.length} user(s).`);
  } catch (error) {
    console.error(`Failed to send department change notification emails: ${error.message}`);
  }
};