import * as meetupService from "../services/meetupService.js";

/**
 * POST /api/groups/:groupId/meetups
 * Create a new meetup in a group
 */
export const createGroupMeetup = async (req, res) => {
    try {
        const { meetup, notifications } = await meetupService.createMeetup({
            groupId: req.params.groupId,
            organizerId: req.user._id,
            body: req.body,
        });

        // Emit socket events
        const io = req.app.get("io");
        if (io) {
            io.to(`group-${req.params.groupId}`).emit("group-meetup:created", { meetup });
            notifications.forEach((n) => {
                io.to(n.userId.toString()).emit("notification:new", n);
            });
        }

        res.status(201).json({
            success: true,
            message: "Meetup created successfully",
            data: { meetup },
        });
    } catch (error) {
        console.error("createGroupMeetup error:", error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Error creating meetup",
        });
    }
};

/**
 * GET /api/groups/:groupId/meetups
 * List all meetups for a group
 */
export const getGroupMeetups = async (req, res) => {
    try {
        const meetups = await meetupService.getGroupMeetups({
            groupId: req.params.groupId,
            userId: req.user._id,
        });

        res.status(200).json({
            success: true,
            data: { meetups },
        });
    } catch (error) {
        console.error("getGroupMeetups error:", error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Error fetching meetups",
        });
    }
};

/**
 * GET /api/meetups/:id
 * Get single meetup
 */
export const getMeetupById = async (req, res) => {
    try {
        const meetup = await meetupService.getMeetupById({
            meetupId: req.params.id,
            userId: req.user._id,
        });

        res.status(200).json({
            success: true,
            data: { meetup },
        });
    } catch (error) {
        console.error("getMeetupById error:", error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Error fetching meetup",
        });
    }
};

/**
 * POST /api/meetups/:id/activate
 * Activate a meetup so members can vote
 */
export const activateMeetup = async (req, res) => {
    try {
        const meetup = await meetupService.activateMeetup({
            meetupId: req.params.id,
            userId: req.user._id,
        });

        const io = req.app.get("io");
        if (io) {
            io.to(`group-${meetup.groupId}`).emit("group-meetup:status-changed", {
                meetupId: meetup._id,
                status: meetup.status,
                meetup,
            });
        }

        res.status(200).json({
            success: true,
            message: "Meetup activated — members can now vote",
            data: { meetup },
        });
    } catch (error) {
        console.error("activateMeetup error:", error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Error activating meetup",
        });
    }
};

/**
 * POST /api/meetups/:id/vote
 * Cast or update a vote (YES / NO)
 */
export const voteOnMeetup = async (req, res) => {
    try {
        const { response } = req.body;

        if (!["YES", "NO"].includes(response)) {
            return res.status(400).json({
                success: false,
                message: "Response must be YES or NO",
            });
        }

        const meetup = await meetupService.castVote({
            meetupId: req.params.id,
            userId: req.user._id,
            response,
        });

        const io = req.app.get("io");
        if (io) {
            io.to(`group-${meetup.groupId}`).emit("group-meetup:voted", {
                meetupId: meetup._id,
                yesCount: meetup.yesCount,
                noCount: meetup.noCount,
                votes: meetup.votes,
                status: meetup.status,
            });

            if (meetup.status === "Confirmed") {
                io.to(`group-${meetup.groupId}`).emit("group-meetup:status-changed", {
                    meetupId: meetup._id,
                    status: "Confirmed",
                    meetup,
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Vote recorded: ${response}`,
            data: { meetup },
        });
    } catch (error) {
        console.error("voteOnMeetup error:", error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Error casting vote",
        });
    }
};

/**
 * POST /api/meetups/:id/complete
 * Mark meetup as completed + trigger Google Sheets sync
 */
export const completeMeetup = async (req, res) => {
    try {
        const meetup = await meetupService.completeMeetup({
            meetupId: req.params.id,
            userId: req.user._id,
        });

        const io = req.app.get("io");
        if (io) {
            io.to(`group-${meetup.groupId}`).emit("group-meetup:status-changed", {
                meetupId: meetup._id,
                status: "Completed",
                meetup,
            });
        }

        res.status(200).json({
            success: true,
            message: "Meetup marked as completed",
            data: { meetup },
        });
    } catch (error) {
        console.error("completeMeetup error:", error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Error completing meetup",
        });
    }
};
