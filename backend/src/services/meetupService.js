import Meeting from "../models/Meeting.js";
import Group from "../models/Group.js";
import { createBulkNotifications } from "./notificationService.js";
import { appendAttendance } from "./googleSheetsService.js";

/**
 * Build notifications for all group members
 */
const buildMemberNotifications = (memberIds, excludeId, type, title, message, relatedId) =>
    memberIds
        .filter((id) => id.toString() !== excludeId.toString())
        .map((userId) => ({
            userId,
            type,
            title,
            message,
            relatedId,
            relatedModel: "Meeting",
        }));

/**
 * Create a new meetup in a group (any member can create, starts as Draft)
 */
export const createMeetup = async ({ groupId, organizerId, body }) => {
    const group = await Group.findById(groupId).populate("members.user", "name email");

    if (!group || !group.isActive) {
        const err = new Error("Group not found or inactive");
        err.statusCode = 404;
        throw err;
    }

    // Allow both regular members and group admins/creator to create meetups
    if (!group.isMember(organizerId) && !group.isAdmin(organizerId)) {
        const err = new Error("Only group members or admins can create meetups");
        err.statusCode = 403;
        throw err;
    }

    const meetingDate = new Date(body.meetingDate);
    if (meetingDate <= new Date()) {
        const err = new Error("Meetup date must be in the future");
        err.statusCode = 400;
        throw err;
    }

    if (body.mode === "PHYSICAL" && !body.location) {
        const err = new Error("Location is required for Physical meetups");
        err.statusCode = 400;
        throw err;
    }

    if (body.mode === "ONLINE" && !body.meetingLink) {
        const err = new Error("Meeting link is required for Online meetups");
        err.statusCode = 400;
        throw err;
    }

    const meetup = await Meeting.create({
        groupId,
        organizerId,
        title: body.title,
        description: body.description || "",
        meetingDate,
        time: body.time,
        duration: body.duration || 60,
        mode: body.mode,
        location: body.location || "",
        meetingLink: body.meetingLink || "",
        minConfirmations: body.minConfirmations,
        status: "Draft",
    });

    // Notify all other group members
    const memberIds = group.members.map((m) => m.user._id || m.user);
    const notifications = buildMemberNotifications(
        memberIds,
        organizerId,
        "group_meetup_created",
        `New Meetup: ${meetup.title}`,
        `A new meetup "${meetup.title}" was scheduled in group "${group.name}"`,
        meetup._id
    );

    const created = await createBulkNotifications(
        notifications.map((n) => n.userId),
        {
            type: notifications[0]?.type,
            title: notifications[0]?.title,
            message: notifications[0]?.message,
            relatedId: meetup._id,
            relatedModel: "Meeting",
        }
    ).catch((e) => { console.error("Notification error:", e.message); return []; });

    return { meetup, notifications: created };
};

/**
 * Get all meetups for a group
 */
export const getGroupMeetups = async ({ groupId, userId }) => {
    const group = await Group.findById(groupId);
    if (!group) {
        const err = new Error("Group not found");
        err.statusCode = 404;
        throw err;
    }

    if (!group.isMember(userId)) {
        const err = new Error("Access denied");
        err.statusCode = 403;
        throw err;
    }

    const meetups = await Meeting.find({ groupId })
        .populate("organizerId", "name email profilePicture")
        .populate("votes.user", "name email profilePicture")
        .sort({ meetingDate: -1 });

    return meetups.map((m) => {
        const obj = m.toObject();
        obj.userVote = m.votes.find((v) => {
            const vid = v.user?._id || v.user;
            return vid?.toString() === userId.toString();
        }) || null;
        return obj;
    });
};

/**
 * Get a single meetup by ID
 */
export const getMeetupById = async ({ meetupId, userId }) => {
    const meetup = await Meeting.findById(meetupId)
        .populate("organizerId", "name email profilePicture")
        .populate("groupId", "name members")
        .populate("votes.user", "name email profilePicture");

    if (!meetup) {
        const err = new Error("Meetup not found");
        err.statusCode = 404;
        throw err;
    }

    const group = await Group.findById(meetup.groupId);
    if (!group || !group.isMember(userId)) {
        const err = new Error("Access denied");
        err.statusCode = 403;
        throw err;
    }

    return meetup;
};

/**
 * Activate a meetup (creator/admin only) — opens it for voting
 */
export const activateMeetup = async ({ meetupId, userId }) => {
    const meetup = await Meeting.findById(meetupId);
    if (!meetup) {
        const err = new Error("Meetup not found");
        err.statusCode = 404;
        throw err;
    }

    const group = await Group.findById(meetup.groupId).populate("members.user", "name email");
    if (!group) {
        const err = new Error("Group not found");
        err.statusCode = 404;
        throw err;
    }

    if (!group.isAdmin(userId) && meetup.organizerId.toString() !== userId.toString()) {
        const err = new Error("Only the group creator/admin or meetup organizer can activate meetups");
        err.statusCode = 403;
        throw err;
    }

    if (meetup.status !== "Draft") {
        const err = new Error("Only Draft meetups can be activated");
        err.statusCode = 400;
        throw err;
    }

    meetup.status = "Active";
    await meetup.save();

    // Notify members
    const memberIds = group.members.map((m) => m.user._id || m.user);
    await createBulkNotifications(
        memberIds.filter((id) => id.toString() !== userId.toString()),
        {
            type: "group_meetup_activated",
            title: `Voting Open: ${meetup.title}`,
            message: `The meetup "${meetup.title}" in "${group.name}" is now open for voting!`,
            relatedId: meetup._id,
            relatedModel: "Meeting",
        }
    ).catch((e) => console.error("Notification error:", e.message));

    return meetup;
};

/**
 * Cast or update a vote (atomic, prevents duplicate votes per user)
 */
export const castVote = async ({ meetupId, userId, response }) => {
    const meetup = await Meeting.findById(meetupId);
    if (!meetup) {
        const err = new Error("Meetup not found");
        err.statusCode = 404;
        throw err;
    }

    if (meetup.status !== "Active") {
        const err = new Error("Voting is only allowed on Active meetups");
        err.statusCode = 400;
        throw err;
    }

    const group = await Group.findById(meetup.groupId).populate("members.user", "name email");
    if (!group || !group.isMember(userId)) {
        const err = new Error("Only group members can vote");
        err.statusCode = 403;
        throw err;
    }

    // Upsert vote atomically
    const existingIndex = meetup.votes.findIndex(
        (v) => (v.user?._id || v.user).toString() === userId.toString()
    );

    if (existingIndex >= 0) {
        meetup.votes[existingIndex].response = response;
        meetup.votes[existingIndex].votedAt = new Date();
    } else {
        meetup.votes.push({ user: userId, response, votedAt: new Date() });
    }

    // Check auto-confirmation
    const yesCount = meetup.votes.filter((v) => v.response === "YES").length;
    let autoConfirmed = false;

    if (yesCount >= meetup.minConfirmations && meetup.status === "Active") {
        meetup.status = "Confirmed";
        autoConfirmed = true;
    }

    await meetup.save();

    // If just confirmed, notify all members
    if (autoConfirmed) {
        const memberIds = group.members.map((m) => m.user._id || m.user);
        await createBulkNotifications(memberIds, {
            type: "group_meetup_confirmed",
            title: `Meetup Confirmed: ${meetup.title}`,
            message: `The meetup "${meetup.title}" in "${group.name}" has been automatically confirmed! 🎉`,
            relatedId: meetup._id,
            relatedModel: "Meeting",
        }).catch((e) => console.error("Notification error:", e.message));
    }

    return meetup;
};

/**
 * Mark meetup as Completed and sync attendance to Google Sheets
 */
export const completeMeetup = async ({ meetupId, userId }) => {
    const meetup = await Meeting.findById(meetupId)
        .populate("votes.user", "name email");

    if (!meetup) {
        const err = new Error("Meetup not found");
        err.statusCode = 404;
        throw err;
    }

    const group = await Group.findById(meetup.groupId).populate("members.user", "name email");
    if (!group) {
        const err = new Error("Group not found");
        err.statusCode = 404;
        throw err;
    }

    if (!group.isAdmin(userId) && meetup.organizerId.toString() !== userId.toString()) {
        const err = new Error("Only the group admin or meetup organizer can mark meetups as completed");
        err.statusCode = 403;
        throw err;
    }

    if (!["Confirmed", "Active"].includes(meetup.status)) {
        const err = new Error("Only Confirmed or Active meetups can be completed");
        err.statusCode = 400;
        throw err;
    }

    meetup.status = "Completed";
    await meetup.save();

    // Notify all members
    const memberIds = group.members.map((m) => m.user._id || m.user);
    await createBulkNotifications(memberIds, {
        type: "group_meetup_completed",
        title: `Meetup Completed: ${meetup.title}`,
        message: `The meetup "${meetup.title}" in "${group.name}" has been marked as completed.`,
        relatedId: meetup._id,
        relatedModel: "Meeting",
    }).catch((e) => console.error("Notification error:", e.message));

    // Sync to Google Sheets for online meetings (non-fatal)
    if (["ONLINE", "HYBRID"].includes(meetup.mode) && !meetup.attendanceSynced) {
        try {
            const yesVoterIds = meetup.votes
                .filter((v) => v.response === "YES")
                .map((v) => (v.user?._id || v.user).toString());

            const attendees = group.members.map((m) => {
                const memberId = (m.user._id || m.user).toString();
                return {
                    name: m.user.name || "Unknown",
                    status: yesVoterIds.includes(memberId) ? "Present" : "Absent",
                };
            });

            const result = await appendAttendance({
                groupName: group.name,
                meetupTitle: meetup.title,
                attendees,
            });

            if (result.success) {
                meetup.attendanceSynced = true;
                await meetup.save();
            }
        } catch (e) {
            console.error("Google Sheets sync error (non-fatal):", e.message);
        }
    }

    return meetup;
};

/**
 * Auto-cancel overdue Active meetups (called by cron job)
 */
export const autoCancelOverdueMeetups = async () => {
    const now = new Date();
    const overdue = await Meeting.find({
        status: "Active",
        meetingDate: { $lt: now },
    }).populate("groupId", "name members");

    if (overdue.length === 0) return 0;

    const ids = overdue.map((m) => m._id);
    await Meeting.updateMany({ _id: { $in: ids } }, { $set: { status: "Cancelled" } });

    for (const meetup of overdue) {
        if (!meetup.groupId) continue;
        const group = await Group.findById(meetup.groupId._id || meetup.groupId);
        if (!group) continue;
        const memberIds = group.members.map((m) => m.user._id || m.user);
        await createBulkNotifications(memberIds, {
            type: "group_meetup_cancelled",
            title: `Meetup Cancelled: ${meetup.title}`,
            message: `The meetup "${meetup.title}" in "${meetup.groupId.name || "your group"}" was auto-cancelled due to insufficient confirmations.`,
            relatedId: meetup._id,
            relatedModel: "Meeting",
        }).catch((e) => console.error("Auto-cancel notification error:", e.message));
    }

    console.log(`[MeetupService] Auto-cancelled ${ids.length} overdue meetup(s).`);
    return ids.length;
};
