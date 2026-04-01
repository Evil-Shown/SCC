export const validateCreateTimetable = (req, res, next) => {
  const { universitySchedule } = req.body || {};
  const errors = [];

  if (!Array.isArray(universitySchedule) || universitySchedule.length === 0) {
    errors.push("universitySchedule must be a non-empty array of events");
  } else {
    universitySchedule.forEach((event, index) => {
      if (!event || typeof event !== "object") {
        errors.push(`Event at index ${index} must be an object`);
        return;
      }
      if (!event.title || typeof event.title !== "string") {
        errors.push(`Event at index ${index} is missing a valid title`);
      }
      if (!event.start) {
        errors.push(`Event at index ${index} is missing start`);
      }
      if (!event.end) {
        errors.push(`Event at index ${index} is missing end`);
      }
    });
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

export const validateGenerateTimetable = (req, res, next) => {
  const { difficultyLevels, preferredStudyHours } = req.body || {};
  const errors = [];

  if (difficultyLevels && typeof difficultyLevels !== "object") {
    errors.push("difficultyLevels must be an object keyed by subjectCode");
  }

  if (preferredStudyHours) {
    const { startHour, endHour } = preferredStudyHours;
    if (
      typeof startHour !== "number" ||
      typeof endHour !== "number" ||
      startHour < 0 ||
      startHour > 23 ||
      endHour < 0 ||
      endHour > 23
    ) {
      errors.push("preferredStudyHours.startHour and endHour must be numbers between 0 and 23");
    }
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

export const validateGoogleSync = (req, res, next) => {
  // accessToken is optional if user already connected via OAuth (backend uses stored refresh token)
  const { accessToken } = req.body || {};
  if (accessToken != null && typeof accessToken !== "string") {
    return res.status(400).json({
      success: false,
      message: "accessToken must be a string when provided"
    });
  }
  next();
};

