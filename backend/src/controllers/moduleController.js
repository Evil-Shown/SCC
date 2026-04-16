import Module, { BatchTypes, RoomTypes, SessionTypes } from "../models/Module.js";

export const listModules = async (req, res) => {
  try {
    const { year, semester, batchType } = req.query || {};
    const filter = { user: req.user._id };
    if (year != null && year !== "") filter.year = Number(year);
    if (semester != null && semester !== "") filter.semester = Number(semester);
    if (batchType) filter.batchType = batchType;

    const modules = await Module.find(filter).sort({ year: 1, semester: 1, code: 1 });
    return res.status(200).json({ success: true, data: modules });
  } catch (error) {
    console.error("listModules:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to list modules" });
  }
};

export const createModule = async (req, res) => {
  try {
    const {
      name,
      code,
      sessionType,
      durationMinutes,
      requiredRoomType,
      year,
      semester,
      batchType,
      sessionsPerWeek,
      metadata
    } = req.body || {};

    const required = ["name", "code", "sessionType", "durationMinutes", "requiredRoomType", "year", "semester", "batchType"];
    for (const k of required) {
      if (req.body?.[k] == null || req.body?.[k] === "") {
        return res.status(400).json({ success: false, message: `${k} is required` });
      }
    }
    if (!Object.values(SessionTypes).includes(sessionType)) {
      return res.status(400).json({ success: false, message: "Invalid sessionType" });
    }
    if (!Object.values(RoomTypes).includes(requiredRoomType)) {
      return res.status(400).json({ success: false, message: "Invalid requiredRoomType" });
    }
    if (!Object.values(BatchTypes).includes(batchType)) {
      return res.status(400).json({ success: false, message: "Invalid batchType" });
    }

    const doc = await Module.create({
      user: req.user._id,
      name,
      code,
      sessionType,
      durationMinutes: Number(durationMinutes),
      requiredRoomType,
      year: Number(year),
      semester: Number(semester),
      batchType,
      sessionsPerWeek: sessionsPerWeek == null || sessionsPerWeek === "" ? 1 : Number(sessionsPerWeek),
      metadata: metadata || {}
    });

    return res.status(201).json({ success: true, message: "Module created", data: doc });
  } catch (error) {
    const msg = error?.code === 11000
      ? "This module code already exists for the same session type. Use another code or change session type."
      : (error.message || "Failed to create module");
    console.error("createModule:", error);
    return res.status(400).json({ success: false, message: msg });
  }
};

export const updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates.user;

    const updated = await Module.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Module not found" });
    }

    return res.status(200).json({ success: true, message: "Module updated", data: updated });
  } catch (error) {
    const msg = error?.code === 11000
      ? "This module code already exists for the same session type."
      : (error.message || "Failed to update module");
    return res.status(400).json({ success: false, message: msg });
  }
};

export const deleteModule = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Module.findOneAndDelete({ _id: id, user: req.user._id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Module not found" });
    }
    return res.status(200).json({ success: true, message: "Module deleted", data: { id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete module" });
  }
};

