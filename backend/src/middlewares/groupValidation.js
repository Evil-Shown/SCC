/**
 * Lightweight, inline group validation middleware (no external Joi/Zod dep).
 * Follows the existing validation.js pattern.
 */

export const validateCreateGroup = (req, res, next) => {
    const { name } = req.body;
    const errors = [];

    if (!name || String(name).trim().length < 2) {
        errors.push("Group name must be at least 2 characters");
    }
    if (name && String(name).trim().length > 80) {
        errors.push("Group name must be 80 characters or fewer");
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    next();
};

export const validateUpdateGroup = (req, res, next) => {
    const { name, maxMembers, description } = req.body;
    const errors = [];

    if (name !== undefined && String(name).trim().length < 2) {
        errors.push("Group name must be at least 2 characters");
    }
    if (name !== undefined && String(name).trim().length > 80) {
        errors.push("Group name must be 80 characters or fewer");
    }
    if (description !== undefined && String(description).length > 500) {
        errors.push("Description must be 500 characters or fewer");
    }
    if (maxMembers !== undefined && (isNaN(maxMembers) || maxMembers < 2 || maxMembers > 500)) {
        errors.push("maxMembers must be between 2 and 500");
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    next();
};

export const validateInvite = (req, res, next) => {
    const { userId, email } = req.body;
    const errors = [];

    if (!userId && !email) {
        errors.push("Either userId or email is required");
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    next();
};

export const validatePromoteRole = (req, res, next) => {
    const { role } = req.body;
    const errors = [];

    if (!role || !["admin", "member"].includes(role)) {
        errors.push("role must be 'admin' or 'member'");
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    next();
};
