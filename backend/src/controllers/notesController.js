import Note from "../models/Note.js";
import Reaction from "../models/Reaction.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import { sendNoteCommentEmail } from "../utils/emailService.js";

export const createNote = async (req, res) => {
  try {
    const { title, description, onedriveLink, tags, subject, year } = req.body;
    const userId = req.user._id;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required"
      });
    }

    const note = await Note.create({
      userId,
      title,
      description,
      onedriveLink: onedriveLink || "",
      tags: tags || [],
      subject: subject || "",
      year: year || null
    });

    const populatedNote = await Note.findById(note._id)
      .populate("userId", "name email profilePicture department");

    const io = req.app.get("io");
    io.emit("new-note", populatedNote);

    res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: populatedNote
    });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create note"
    });
  }
};

export const getNotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const tag = req.query.tag;
    const userId = req.query.userId;
    const subject = req.query.subject;
    const year = req.query.year;

    let filter = {};
    if (tag) {
      filter.tags = tag;
    }
    if (userId) {
      filter.userId = userId;
    }
    if (subject) {
      filter.subject = subject;
    }
    if (year) {
      filter.year = Number(year);
    }

    const notes = await Note.find(filter)
      .populate("userId", "name email profilePicture department year")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Note.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: notes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch notes"
    });
  }
};

export const searchNotes = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const subject = req.query.subject;
    const year = req.query.year;

    const searchFilter = {
      $or: [
        { title: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
        { tags: { $in: [new RegExp(searchQuery, "i")] } }
      ]
    };
    if (subject) searchFilter.subject = subject;
    if (year) searchFilter.year = Number(year);

    const notes = await Note.find(searchFilter)
      .populate("userId", "name email profilePicture department year")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Note.countDocuments(searchFilter);

    res.status(200).json({
      success: true,
      data: notes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      searchQuery
    });
  } catch (error) {
    console.error("Error searching notes:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to search notes"
    });
  }
};

export const reactToNote = async (req, res) => {
  try {
    const { noteId, type } = req.body;
    const userId = req.user._id;

    if (!noteId || !type) {
      return res.status(400).json({
        success: false,
        message: "Note ID and reaction type are required"
      });
    }

    if (!["like", "dislike"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reaction type. Must be 'like' or 'dislike'"
      });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found"
      });
    }

    const existingReaction = await Reaction.findOne({ userId, noteId });

    if (existingReaction) {
      const oldType = existingReaction.type;

      if (oldType === type) {
        await Reaction.deleteOne({ _id: existingReaction._id });

        if (type === "like") {
          note.reactionsCount.likes = Math.max(0, note.reactionsCount.likes - 1);
        } else {
          note.reactionsCount.dislikes = Math.max(0, note.reactionsCount.dislikes - 1);
        }
        await note.save();

        return res.status(200).json({
          success: true,
          message: "Reaction removed",
          data: {
            noteId,
            reactionsCount: note.reactionsCount,
            userReaction: null
          }
        });
      } else {
        existingReaction.type = type;
        await existingReaction.save();

        if (type === "like") {
          note.reactionsCount.likes += 1;
          note.reactionsCount.dislikes = Math.max(0, note.reactionsCount.dislikes - 1);
        } else {
          note.reactionsCount.dislikes += 1;
          note.reactionsCount.likes = Math.max(0, note.reactionsCount.likes - 1);
        }
        await note.save();

        return res.status(200).json({
          success: true,
          message: "Reaction updated",
          data: {
            noteId,
            reactionsCount: note.reactionsCount,
            userReaction: type
          }
        });
      }
    }

    const reaction = await Reaction.create({ userId, noteId, type });

    if (type === "like") {
      note.reactionsCount.likes += 1;
    } else {
      note.reactionsCount.dislikes += 1;
    }
    await note.save();

    if (note.userId.toString() !== userId.toString()) {
      await Notification.create({
        userId: note.userId,
        type: "note_reaction",
        title: "New Reaction",
        message: `Someone ${type}d your note: ${note.title}`,
        relatedId: noteId,
        relatedModel: "Note"
      });
    }

    const io = req.app.get("io");
    io.to(note.userId.toString()).emit("notification", {
      type: "note_reaction",
      noteId,
      reactionType: type
    });

    res.status(201).json({
      success: true,
      message: "Reaction added",
      data: {
        noteId,
        reactionsCount: note.reactionsCount,
        userReaction: type
      }
    });
  } catch (error) {
    console.error("Error reacting to note:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add reaction"
    });
  }
};

export const commentOnNote = async (req, res) => {
  try {
    const { noteId, commentText } = req.body;
    const userId = req.user._id;

    if (!noteId || !commentText) {
      return res.status(400).json({
        success: false,
        message: "Note ID and comment text are required"
      });
    }

    const note = await Note.findById(noteId).populate("userId", "email name");
    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found"
      });
    }

    const comment = await Comment.create({
      userId,
      noteId,
      commentText
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate("userId", "name email profilePicture department");

    note.commentsCount += 1;
    await note.save();

    if (note.userId._id.toString() !== userId.toString()) {
      await Notification.create({
        userId: note.userId._id,
        type: "note_comment",
        title: "New Comment",
        message: `${req.user.name} commented on your note: ${note.title}`,
        relatedId: comment._id,
        relatedModel: "Comment"
      });

      sendNoteCommentEmail(
        note.userId.email,
        { title: note.title },
        { userName: req.user.name, commentText }
      ).catch(err => console.error("Email error:", err));
    }

    const io = req.app.get("io");
    io.to(note.userId._id.toString()).emit("notification", {
      type: "note_comment",
      noteId,
      comment: populatedComment
    });
    io.emit("new-comment", { noteId, comment: populatedComment });

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: populatedComment
    });
  } catch (error) {
    console.error("Error commenting on note:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add comment"
    });
  }
};

export const getCommentsForNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ noteId })
      .populate("userId", "name email profilePicture department")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ noteId });

    res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch comments"
    });
  }
};

export default {
  createNote,
  getNotes,
  searchNotes,
  reactToNote,
  commentOnNote,
  getCommentsForNote
};
