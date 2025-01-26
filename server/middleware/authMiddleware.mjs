// server/middleware/authMiddleware.mjs

import jwt from 'jsonwebtoken';
import User from '../models/User.mjs'; // Ensure the path is correct

// Ensure you have a JWT_SECRET in your environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'NCASNKJCWDWNKJFEWK234234RRSDDW@!@!!!!DW';

/**
 * Middleware to authenticate the user based on JWT token
 */
export const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if the Authorization header is present and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication invalid: No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token part

  try {
    // Verify the token and decode the payload
    const payload = jwt.verify(token, JWT_SECRET);

    console.log("Decoded JWT Payload:", payload);  // Debugging

    // Attach the user to the request object using _id
    req.user = await User.findById(payload._id).select('-password'); // Exclude password

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication invalid: User not found' });
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication invalid: Token verification failed' });
  }
};

/**
 * Middleware to authorize users based on their roles
 * @param  {...string} roles - The roles that are allowed to access the route
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    next(); // User has one of the required roles
  };
};
