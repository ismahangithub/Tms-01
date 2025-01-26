import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DBCONNECTION_STRING = process.env.DBCONNECTION_STRING;

const connectDB = async () => {
  try {
      console.log("Attempting to connect to MongoDB...");
      const conn = await mongoose.connect(DBCONNECTION_STRING);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
  }
};

export default connectDB;