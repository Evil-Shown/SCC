import fs from "fs/promises";

import Resource, { ResourceTypes } from "../models/Resource.js";
import TimetableSlot from "../models/TimetableSlot.js";
import { extractResourcesFromFile } from "../utils/resourceExtraction.js";

export const listResources = async (req, res) => {
  try {
    const resources = await Resource.find({ user: req.user._id })
      .sort({ resourceType: 1, name: 1 });
    return res.status(200).json({ success: true, data: resources });
  } catch (error) {
    console.error("listResources:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to list resources" });
  }
};

export const createResource = async (req, res) => {
  try {
    const { name, resourceType, location, metadata } = req.body || {};
    if (!name || !resourceType) {
      return res.status(400).json({ success: false, message: "name and resourceType are required" });
    }
    if (!Object.values(ResourceTypes).includes(resourceType)) {
      return res.status(400).json({ success: false, message: "Invalid resourceType" });
    }

    const doc = await Resource.create({
      user: req.user._id,
      name,
      resourceType,
      location: location || "",
      metadata: metadata || {}
    });

    return res.status(201).json({ success: true, message: "Resource created", data: doc });
  } catch (error) {
    const msg = error?.code === 11000 ? "Resource already exists" : (error.message || "Failed to create resource");
    return res.status(400).json({ success: false, message: msg });
  }
};

export const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates.user;
    delete updates.capacity;

    const updated = await Resource.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }

    return res.status(200).json({ success: true, message: "Resource updated", data: updated });
  } catch (error) {
    const msg = error?.code === 11000 ? "Resource already exists" : (error.message || "Failed to update resource");
    return res.status(400).json({ success: false, message: msg });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Resource.findOneAndDelete({ _id: id, user: req.user._id });
    if (!deleted) {
      // Idempotent delete: if it's already gone, treat as success for UX stability.
      return res.status(200).json({ success: true, message: "Resource already deleted", data: { id, alreadyDeleted: true } });
    }
    return res.status(200).json({ success: true, message: "Resource deleted", data: { id } });
  } catch (error) {
    console.error("deleteResource:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete resource" });
  }
};

export const deleteAllResources = async (req, res) => {
  try {
    const resources = await Resource.find({ user: req.user._id }, { _id: 1 });
    const resourceIds = resources.map((r) => r._id);

    const [resourceDeleteResult, slotDeleteResult] = await Promise.all([
      Resource.deleteMany({ user: req.user._id }),
      resourceIds.length > 0
        ? TimetableSlot.deleteMany({ resource: { $in: resourceIds } })
        : Promise.resolve({ deletedCount: 0 })
    ]);

    return res.status(200).json({
      success: true,
      message: "All resources deleted",
      data: {
        resourcesDeleted: resourceDeleteResult.deletedCount || 0,
        slotsDeleted: slotDeleteResult.deletedCount || 0
      }
    });
  } catch (error) {
    console.error("deleteAllResources:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete all resources" });
  }
};

export const importResourcesFromFile = async (req, res) => {
  const filePath = req.file?.path;
  if (!filePath) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  try {
    const extracted = await extractResourcesFromFile({ filePath, mimetype: req.file.mimetype });
    const candidates = (extracted?.resources || [])
      .map((r) => ({
        name: String(r?.name || "").trim(),
        resourceType: r?.resourceType,
        location: String(r?.location || "").trim()
      }))
      .filter((r) => r.name && Object.values(ResourceTypes).includes(r.resourceType));

    if (candidates.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No resources detected in file",
        data: { created: 0, resources: [], extractedTextPreview: extracted?.textPreview || "" }
      });
    }

    const ops = candidates.map((r) => ({
      updateOne: {
        filter: { user: req.user._id, resourceType: r.resourceType, name: r.name },
        update: { $setOnInsert: { user: req.user._id, ...r } },
        upsert: true
      }
    }));

    const bulkRes = await Resource.bulkWrite(ops, { ordered: false });
    const created = bulkRes?.upsertedCount || 0;
    const resources = await Resource.find({ user: req.user._id }).sort({ resourceType: 1, name: 1 });

    return res.status(200).json({
      success: true,
      message: created > 0 ? "Resources imported" : "No new resources (all existed)",
      data: { created, resources, extractedTextPreview: extracted?.textPreview || "" }
    });
  } catch (error) {
    console.error("importResourcesFromFile:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to import resources" });
  } finally {
    // best-effort cleanup; upload middleware stores to disk
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore
    }
  }
};

