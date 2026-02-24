import KuppiPost from "../models/KuppiPost.js";
import KuppiApplicant from "../models/KuppiApplicant.js";
import Notification from "../models/Notification.js";
import { sendKuppiNotificationEmail } from "../utils/emailService.js";
import { generateApplicantsExcel } from "../utils/excelExport.js";

export const createKuppiPost = async (req, res) => {
  try {
    const { title, description, eventDate, meetingLink } = req.body;
    const ownerId = req.user._id;

    if (!title || !description || !eventDate) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and event date are required"
      });
    }

    const eventDateObj = new Date(eventDate);
    if (eventDateObj < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Event date cannot be in the past"
      });
    }

    const kuppiPost = await KuppiPost.create({
      ownerId,
      title,
      description,
      eventDate: eventDateObj,
      meetingLink: meetingLink || "",
      status: meetingLink ? "scheduled" : "pending"
    });

    const populatedPost = await KuppiPost.findById(kuppiPost._id)
      .populate("ownerId", "name email profilePicture department");

    const io = req.app.get("io");
    io.emit("new-kuppi", populatedPost);

    if (meetingLink) {
      await triggerMeetingLinkNotifications(kuppiPost._id, kuppiPost);
    }

    res.status(201).json({
      success: true,
      message: "Kuppi post created successfully",
      data: populatedPost
    });
  } catch (error) {
    console.error("Error creating kuppi post:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create kuppi post"
    });
  }
};

export const updateKuppiPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, description, eventDate, meetingLink } = req.body;
    const userId = req.user._id;

    const kuppiPost = await KuppiPost.findById(postId);
    if (!kuppiPost) {
      return res.status(404).json({
        success: false,
        message: "Kuppi post not found"
      });
    }

    if (kuppiPost.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this kuppi post"
      });
    }

    const hadMeetingLink = !!kuppiPost.meetingLink;

    if (title) kuppiPost.title = title;
    if (description) kuppiPost.description = description;
    if (eventDate) {
      const eventDateObj = new Date(eventDate);
      if (eventDateObj < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Event date cannot be in the past"
        });
      }
      kuppiPost.eventDate = eventDateObj;
    }
    if (meetingLink !== undefined) {
      kuppiPost.meetingLink = meetingLink;
      if (meetingLink) {
        kuppiPost.status = "scheduled";
      }
    }

    await kuppiPost.save();

    const populatedPost = await KuppiPost.findById(postId)
      .populate("ownerId", "name email profilePicture department");

    if (meetingLink && !hadMeetingLink) {
      await triggerMeetingLinkNotifications(postId, kuppiPost);
    }

    res.status(200).json({
      success: true,
      message: "Kuppi post updated successfully",
      data: populatedPost
    });
  } catch (error) {
    console.error("Error updating kuppi post:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update kuppi post"
    });
  }
};

const triggerMeetingLinkNotifications = async (postId, kuppiPost) => {
  try {
    const applicants = await KuppiApplicant.find({ 
      postId, 
      notificationSent: false 
    }).populate("applicantId", "email name");

    const kuppiDetails = {
      title: kuppiPost.title,
      description: kuppiPost.description,
      eventDate: kuppiPost.eventDate,
      meetingLink: kuppiPost.meetingLink
    };

    for (const applicant of applicants) {
      await Notification.create({
        userId: applicant.applicantId._id,
        type: "kuppi_scheduled",
        title: "Kuppi Meeting Scheduled",
        message: `Meeting link added for: ${kuppiPost.title}`,
        relatedId: postId,
        relatedModel: "KuppiPost"
      });

      sendKuppiNotificationEmail(applicant.email, kuppiDetails)
        .then(() => {
          applicant.notificationSent = true;
          return applicant.save();
        })
        .catch(err => console.error("Email error:", err));
    }

    console.log(`Notifications triggered for ${applicants.length} applicants`);
  } catch (error) {
    console.error("Error triggering notifications:", error);
  }
};

export const applyToKuppi = async (req, res) => {
  try {
    const { postId } = req.body;
    const applicantId = req.user._id;
    const name = req.user.name;
    const email = req.user.email;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "Post ID is required"
      });
    }

    const kuppiPost = await KuppiPost.findById(postId);
    if (!kuppiPost) {
      return res.status(404).json({
        success: false,
        message: "Kuppi post not found"
      });
    }

    if (kuppiPost.ownerId.toString() === applicantId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot apply to your own kuppi post"
      });
    }

    const existingApplication = await KuppiApplicant.findOne({ 
      postId, 
      applicantId 
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this kuppi"
      });
    }

    const application = await KuppiApplicant.create({
      postId,
      applicantId,
      name,
      email
    });

    kuppiPost.applicantsCount += 1;
    await kuppiPost.save();

    const io = req.app.get("io");
    io.to(kuppiPost.ownerId.toString()).emit("new-kuppi-applicant", {
      postId,
      applicant: application
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this kuppi"
      });
    }
    console.error("Error applying to kuppi:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to apply to kuppi"
    });
  }
};

export const getKuppiApplicants = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const kuppiPost = await KuppiPost.findById(postId);
    if (!kuppiPost) {
      return res.status(404).json({
        success: false,
        message: "Kuppi post not found"
      });
    }

    if (kuppiPost.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view applicants for this kuppi"
      });
    }

    const applicants = await KuppiApplicant.find({ postId })
      .populate("applicantId", "name email studentId department year phone profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: applicants,
      total: applicants.length
    });
  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch applicants"
    });
  }
};

export const exportKuppiApplicants = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const kuppiPost = await KuppiPost.findById(postId);
    if (!kuppiPost) {
      return res.status(404).json({
        success: false,
        message: "Kuppi post not found"
      });
    }

    if (kuppiPost.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to export applicants for this kuppi"
      });
    }

    const applicants = await KuppiApplicant.find({ postId })
      .populate("applicantId", "name email studentId department year")
      .sort({ createdAt: -1 });

    if (applicants.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No applicants found for this kuppi"
      });
    }

    const workbook = await generateApplicantsExcel(applicants, {
      title: kuppiPost.title,
      eventDate: kuppiPost.eventDate
    });

    const filename = `Kuppi_Applicants_${kuppiPost.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting applicants:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to export applicants"
    });
  }
};

export const getKuppiPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const ownerId = req.query.ownerId;
    const status = req.query.status;

    let filter = {};
    if (ownerId) {
      filter.ownerId = ownerId;
    }
    if (status) {
      filter.status = status;
    }

    const posts = await KuppiPost.find(filter)
      .populate("ownerId", "name email profilePicture department")
      .sort({ eventDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await KuppiPost.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching kuppi posts:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch kuppi posts"
    });
  }
};

export default {
  createKuppiPost,
  updateKuppiPost,
  applyToKuppi,
  getKuppiApplicants,
  exportKuppiApplicants,
  getKuppiPosts
};
