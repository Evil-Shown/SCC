import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

function parseBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== "string") return null;
  const m = authHeader.match(/^Bearer\s+(\S+)/i);
  return m ? m[1].trim() : null;
}

function normalizeToken(t) {
  if (t == null || t === "") return null;
  const s = String(t).trim();
  if (!s || s === "undefined" || s === "null") return null;
  return s;
}

/**
 * Authenticate user using JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Fallback for flows where header may be stripped by browser/proxy
    // (e.g. OAuth bootstrap redirect requests).
    const queryToken =
      typeof req.query?.token === "string" ? req.query.token : null;

    const token = normalizeToken(parseBearerToken(authHeader) || queryToken);

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided. Authorization denied." 
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found. Authorization denied." 
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.message === "Invalid or expired token") {
      return res.status(401).json({ 
        success: false,
        message: "Token is invalid or expired." 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: "Server error during authentication." 
    });
  }
};

/**
 * Role-based access control middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required." 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}` 
      });
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token is valid, continues anyway
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = normalizeToken(parseBearerToken(authHeader));

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Continue without authentication
  }
  
  next();
};

// Export authenticate as 'protect' for convenience
export const protect = authenticate;
