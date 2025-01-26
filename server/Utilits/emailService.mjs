import nodemailer from "nodemailer";
import { EMAIL_PASS, EMAIL_USER } from "../configs/config.mjs"; // Ensure these are defined
import dotenv from "dotenv";
import moment from "moment"; // If used elsewhere

dotenv.config();

// Configure transporter
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
    throw error; // Rethrow to handle in caller
  }
};

// 1. Welcome Email
export const sendWelcomeEmail = async (to, firstName, email, password) => {
  const subject = "Welcome to TMS!";
  const text = `
    Hello ${firstName},

    Welcome to the Task Management System (TMS)! Here are your login credentials:

    Email: ${email}
    Password: ${password}

    Please log in and change your password.

    Best regards,
    TMS Team
  `;

  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send welcome email to ${to}: ${error.message}`);
  }
};

// 2. Task Assignment Email
export const sendAssignmentEmail = async (to, taskTitle, dueDate) => {
  const subject = "New Task Assigned!";
  const text = `
    Hello,

    You have been assigned a task: "${taskTitle}".
    Please complete it by ${moment(dueDate).format("MMMM Do YYYY")}

    Best regards,
    TMS Team
  `;

  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send assignment email to ${to}: ${error.message}`);
  }
};

// 3. Task Reminder Email
export const sendReminderEmail = async (to, taskTitle, hoursRemaining) => {
  const subject = "Task Reminder";
  const text = `
    Hello,

    This is a reminder for your task: "${taskTitle}".
    You have ${hoursRemaining} hours left to complete it.

    Best regards,
    TMS Team
  `;

  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send reminder email to ${to}: ${error.message}`);
  }
};

// 4. Overdue Task Alert
export const sendOverdueEmail = async (to, taskTitle, dueDate) => {
  const subject = "Overdue Task Alert";
  const text = `
    Hello,

    The task "${taskTitle}" was due on ${moment(dueDate).format("MMMM Do YYYY")} and is now overdue.
    Please address this as soon as possible.

    Best regards,
    TMS Team
  `;

  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send overdue email to ${to}: ${error.message}`);
  }
};

// 5. Project Completion Notification
export const sendProjectCompletionEmail = async (to, projectName) => {
  const subject = "Project Completed!";
  const text = `
    Hello,

    Congratulations! The project "${projectName}" has been successfully completed.

    Best regards,
    TMS Team
  `;

  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send project completion email to ${to}: ${error.message}`);
  }
};

// 6. Project Overdue Alert
export const sendProjectOverdueEmail = async (to, projectName, dueDate) => {
  const subject = "Overdue Project Alert";
  const text = `
    Hello,

    The project "${projectName}" was due on ${moment(dueDate).format("MMMM Do YYYY")} and is now overdue.
    Please review and take necessary actions.

    Best regards,
    TMS Team
  `;

  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send project overdue email to ${to}: ${error.message}`);
  }
};

// 7. Weekly/Monthly Report
export const sendReportEmail = async (to, reportType, reportData) => {
  const subject = `${reportType} Report`;
  const text = `
    Hello,

    Here is your ${reportType} report:

    ${reportData}

    Best regards,
    TMS Team
  `;

  try {
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send report email to ${to}: ${error.message}`);
  }
};

// 8. Department Change Notification
export const sendDepartmentChangeNotification = async (
  recipients,
  firstName,
  lastName,
  email,
  role,
  departmentId
) => {
  const subject = "Department Update Notification";
  const text = `
    Hello,

    We wanted to inform you that ${firstName} ${lastName} (${email}) has been added to your department.

    Role: ${role}

    Best regards,
    TMS Team
  `;

  try {
    for (const recipient of recipients) {
      await sendEmail({ to: recipient, subject, text });
    }
    console.log(`Department change notification emails sent to ${recipients.length} user(s).`);
  } catch (error) {
    console.error(`Failed to send department change notification emails: ${error.message}`);
  }
};

// 9. Send Comment Email
export const sendCommentEmail = async (recipients, content, author) => {
  const subject = `New Comment by ${author.fullName}`;

  // Format the content to display user-friendly information
  const text = `
    Hello,

    A new comment has been posted by ${author.fullName}.

    Comment:
    "${content}"

    Author's Details:
    Name: ${author.fullName}
    Email: ${author.email}
    Role: ${author.role}

    Comment posted on: ${new Date().toLocaleString()} (Created: ${new Date(author.createdAt).toLocaleString()}, Updated: ${new Date(author.updatedAt).toLocaleString()})

    If you would like to reply to this comment or discuss further, please visit the system.

    Best regards,
    TMS Team
  `;

  try {
    await sendEmail({ to: recipients, subject, text });
  } catch (error) {
    console.error(`Failed to send comment email: ${error.message}`);
  }
};
export const sendProjectDueReminderEmail = async (toEmails, projectName, dueDate) => {
  const subject = "Project Due Reminder";
  const text = `
    Hello,

    This is a reminder that the project "${projectName}" is due on 
    ${moment(dueDate).format("MMMM Do YYYY")}.

    Please ensure all tasks are completed before that date.

    Best regards,
    TMS Team
  `;
  try {
    // 'toEmails' could be an array -> join them 
    const to = Array.isArray(toEmails) ? toEmails.join(", ") : toEmails;
    await sendEmail({ to, subject, text });
  } catch (error) {
    console.error(`Failed to send project due reminder: ${error.message}`);
  }
};