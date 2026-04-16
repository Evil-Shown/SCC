import Poll from "../models/Poll.js";
import Group from "../models/Group.js";
import mongoose from "mongoose";

// Create Poll
export const createPoll = async (req, res) => {
    try {
        const { groupId } = req.params;
        const {
            question, message, options, isMultipleChoice,
            isAnonymous, allowOther, maxVotesPerUser, status, endDate
        } = req.body;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ success: false, message: "Group not found" });

        // Validate options
        if (!options || options.length < 2) {
            return res.status(400).json({ success: false, message: "Poll requires at least 2 options." });
        }

        const uniqueOptions = new Set(options.map(o => o.text.trim()));
        if (uniqueOptions.size !== options.length) {
            return res.status(400).json({ success: false, message: "Duplicate options are not allowed." });
        }

        const formattedOptions = options.map(o => ({ text: o.text.trim(), votes: [] }));

        const poll = new Poll({
            groupId,
            creatorId: req.user._id,
            question,
            message,
            options: formattedOptions,
            isMultipleChoice,
            isAnonymous,
            allowOther,
            maxVotesPerUser,
            status: status || "Live",
            endDate
        });

        await poll.save();

        // Emit via socket
        req.app.get("io").to(`group-${groupId}`).emit("group-poll:created", poll);

        res.status(201).json({ success: true, poll });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all polls for a group
export const getGroupPolls = async (req, res) => {
    try {
        const { groupId } = req.params;
        const polls = await Poll.find({ groupId })
            .populate("creatorId", "name avatar")
            .populate("options.votes.user", "name avatar")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, polls });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Vote on a poll
export const votePoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const { optionIds } = req.body; // Array of option ObjectIds

        const poll = await Poll.findById(pollId);
        if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });

        if (poll.status !== "Live") {
            return res.status(400).json({ success: false, message: "Poll is not currently active." });
        }

        if (poll.endDate && new Date(poll.endDate) < new Date()) {
            poll.status = "Closed";
            await poll.save();
            return res.status(400).json({ success: false, message: "Poll has expired." });
        }

        if (!Array.isArray(optionIds) || optionIds.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid voting options." });
        }

        if (!poll.isMultipleChoice && optionIds.length > 1) {
            return res.status(400).json({ success: false, message: "This poll only allows a single choice." });
        }

        if (poll.maxVotesPerUser && optionIds.length > poll.maxVotesPerUser) {
            return res.status(400).json({ success: false, message: `You can only select up to ${poll.maxVotesPerUser} options.` });
        }

        // Remove user's previous votes
        poll.options.forEach(opt => {
            opt.votes = opt.votes.filter(v => v.user.toString() !== req.user._id.toString());
        });

        // Add new votes
        poll.options.forEach(opt => {
            if (optionIds.includes(opt._id.toString())) {
                opt.votes.push({ user: req.user._id, votedAt: new Date() });
            }
        });

        await poll.save();

        const updatedPoll = await Poll.findById(pollId)
            .populate("creatorId", "name avatar")
            .populate("options.votes.user", "name avatar");

        req.app.get("io").to(`group-${poll.groupId}`).emit("group-poll:voted", updatedPoll);

        res.status(200).json({ success: true, poll: updatedPoll });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Poll (Draft or Live features)
export const updatePoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const updates = req.body;

        const poll = await Poll.findById(pollId);
        if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });

        // Only creator can update
        if (poll.creatorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only the creator can edit this poll." });
        }

        // Updating options is tricky if poll is Live and has votes. 
        // If poll is draft, allow full option rewrite.
        if (poll.status === "Draft" && updates.options) {
            poll.options = updates.options.map(o => ({ text: o.text.trim(), votes: [] }));
        }

        if (updates.question) poll.question = updates.question;
        if (updates.message !== undefined) poll.message = updates.message;
        if (updates.status) poll.status = updates.status;

        await poll.save();
        req.app.get("io").to(`group-${poll.groupId}`).emit("group-poll:updated", poll);

        res.status(200).json({ success: true, poll });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Poll
export const deletePoll = async (req, res) => {
    try {
        const { pollId } = req.params;

        const poll = await Poll.findById(pollId);
        if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });

        if (poll.creatorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only the creator can delete this poll." });
        }

        await poll.deleteOne();
        req.app.get("io").to(`group-${poll.groupId}`).emit("group-poll:deleted", pollId);

        res.status(200).json({ success: true, message: "Poll deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
