// import nodemailer from "nodemailer";

// export const sendEmailNotification = async ({ taskTitle, dueDate, assignedUserEmails, managerEmail }) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL, // Use environment variable
//         pass: process.env.EMAIL_PASSWORD, // Use app-specific password
        
//       },
//     });

//     const sendEmail = async (to, subject, text) => {
//       await transporter.sendMail({ from: process.env.EMAIL, to, subject, text });
//     };

//     // Notify assigned users
//     for (const email of assignedUserEmails) {
//       await sendEmail(
//         email,
//         `New Task Assigned: ${taskTitle}`,
//         `You have been assigned a new task: "${taskTitle}" with a due date of ${dueDate}.`
//       );
//     }

//     // Notify manager
//     if (managerEmail) {
//       await sendEmail(
//         managerEmail,
//         `Overdue Task Alert: ${taskTitle}`,
//         `The task "${taskTitle}" is overdue. Please address it immediately.`
//       );
//     }
//   } catch (error) {
//     console.error("Error sending email notifications:", error.message);
//     throw error;
//   }
// };
