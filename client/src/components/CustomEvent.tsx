// // src/components/CustomEvent.tsx
// import React from "react";

// const CustomEvent = ({ event }) => {
//   const { type, title, description, assignedTo, departments } = event;

//   let borderLeftColor;
//   let icon;

//   switch (type) {
//     case "project":
//       borderLeftColor = "#0066cc";
//       icon = "📁"; // Folder icon for projects
//       break;
//     case "task":
//       borderLeftColor = "#ff5733";
//       icon = "✅"; // Checkmark icon for tasks
//       break;
//     case "meeting":
//       borderLeftColor = "#4CAF50";
//       icon = "📅"; // Calendar icon for meetings
//       break;
//     default:
//       borderLeftColor = "#3174ad";
//       icon = "📌"; // Pushpin icon for others
//   }

//   return (
//     <div
//       style={{
//         borderLeft: `4px solid ${borderLeftColor}`,
//         paddingLeft: "5px",
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       <div style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
//         <span style={{ marginRight: "5px" }}>{icon}</span>
//         <strong>{title}</strong>
//       </div>
//       <div style={{ fontSize: "0.8rem", color: "#555", marginBottom: "3px" }}>{description}</div>
//       {assignedTo && (
//         <div style={{ fontSize: "0.8rem", color: "#555", marginBottom: "3px" }}>
//           Assigned To: {assignedTo}
//         </div>
//       )}
//       {departments && (
//         <div style={{ fontSize: "0.8rem", color: "#555" }}>
//           Departments: {departments.join(", ")}
//         </div>
//       )}
//     </div>
//   );
// };

// export default CustomEvent;
