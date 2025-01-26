// config.mjs
import dotenv from "dotenv";

// Load .env file into process.env
dotenv.config();

// Export configuration values
export const DB_URL = process.env.DBCONNECTION_STRING;
export const PORT = process.env.PORT;
export const JWT_SECRET = process.env.JWT_SECRET;
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;
