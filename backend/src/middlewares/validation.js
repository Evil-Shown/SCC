/**
 * Validate registration input
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  // Email validation
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("Please provide a valid email address");
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  // Role validation
  if (role && !["student", "teacher", "admin"].includes(role)) {
    errors.push("Invalid role. Must be student, teacher, or admin");
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false,
      message: "Validation failed",
      errors 
    });
  }

  next();
};

/**
 * Validate login input
 */
export const validateLogin = (req, res, next) => {
  const email = String(req.body.email || "").trim();
  const { password } = req.body;
  const errors = [];

  if (!email) {
    errors.push("Email is required");
  }

  if (!password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false,
      message: "Validation failed",
      errors 
    });
  }

  next();
};
