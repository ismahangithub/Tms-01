// server/Utilits/activityService.mjs
import mongoose from "mongoose";
import Project from "../models/Project Model.mjs";
import Activity from "../models/Activity.mjs"; // Assuming you have an Activity model

/**
 * Add Activity to a Project
 * @param {String} projectId - The ID of the project.
 * @param {String} description - Description of the activity.
 * @param {String} userId - The ID of the user performing the activity.
 */
export const addActivity = async (projectId, description, userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error("Invalid project ID for activity logging.");
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID for activity logging.");
    }

    console.log("Logging activity for project:", projectId);
    console.log("User ID for activity:", userId);

    const activity = new Activity({
      project: projectId,
      description,
      user: userId,  // Valid user ID
    });

    await activity.save();

    // Optionally, push the activity to the project's activities array
    await Project.findByIdAndUpdate(projectId, { $push: { activities: activity._id } });
  } catch (error) {
    console.error("Error logging activity:", error.message);
    throw error;
  }
}
