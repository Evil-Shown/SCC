import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../utils/jwt.js";

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      studentId,
      department,
      year,
      phone,
      bio,
      location,
      website,
      github,
      twitter,
      linkedin
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User with this email already exists" 
      });
    }

    // Check if studentId already exists (if provided)
    if (studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({ 
          success: false,
          message: "Student ID already registered" 
        });
      }
    }

    // Create new user with all fields
    const userData = {
      name,
      email,
      password,
      role: role || "student",
      studentId,
      department,
      year
    };

    // Add optional fields if provided
    if (phone) userData.phone = phone;
    if (bio) userData.bio = bio;
    if (location) userData.location = location;
    if (website) userData.website = website;
    if (github) userData.github = github;
    if (twitter) userData.twitter = twitter;
    if (linkedin) userData.linkedin = linkedin;

    const user = new User(userData);
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to database
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    // Return user without password
    const userResponse = user.toJSON();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: messages.join(", ")
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error registering user",
      error: error.message 
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to database
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error logging in",
      error: error.message 
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false,
        message: "Refresh token is required" 
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);

    if (!tokenExists) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid refresh token" 
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({ 
      success: false,
      message: "Invalid or expired refresh token",
      error: error.message 
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken && req.user) {
      // Remove refresh token from database
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: { token: refreshToken } }
      });
    }

    res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error logging out",
      error: error.message 
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching user profile",
      error: error.message 
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      department,
      year,
      phone,
      bio,
      profilePicture,
      preferences,
      location,
      website,
      github,
      twitter,
      linkedin
    } = req.body;

    const updateData = {};
    const hasField = (key) => Object.prototype.hasOwnProperty.call(req.body, key);

    if (hasField("name")) updateData.name = (name || "").trim();
    if (hasField("department")) updateData.department = (department || "").trim();
    if (hasField("year")) updateData.year = year;
    if (hasField("phone")) updateData.phone = (phone || "").trim();
    if (hasField("bio")) updateData.bio = (bio || "").trim();
    if (hasField("profilePicture")) updateData.profilePicture = profilePicture || "";
    if (hasField("preferences")) updateData.preferences = preferences;
    if (hasField("location")) updateData.location = (location || "").trim();
    if (hasField("website")) updateData.website = (website || "").trim();
    if (hasField("github")) updateData.github = (github || "").trim();
    if (hasField("twitter")) updateData.twitter = (twitter || "").trim();
    if (hasField("linkedin")) updateData.linkedin = (linkedin || "").trim();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: messages.join(", ")
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error updating profile",
      error: error.message 
    });
  }
};
