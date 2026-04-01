import api from "./api.js";

/**
 * Create a meetup in a group
 */
export const createGroupMeetup = (groupId, payload) =>
    api.post(`/api/groups/${groupId}/meetups`, payload);

/**
 * Get all meetups for a group
 */
export const getGroupMeetups = (groupId) =>
    api.get(`/api/groups/${groupId}/meetups`);

/**
 * Get a single meetup by ID
 */
export const getMeetup = (meetupId) =>
    api.get(`/api/meetups/${meetupId}`);

/**
 * Activate a meetup (opens voting)
 */
export const activateMeetup = (meetupId) =>
    api.post(`/api/meetups/${meetupId}/activate`);

/**
 * Cast a vote (YES or NO)
 */
export const voteOnMeetup = (meetupId, response) =>
    api.post(`/api/meetups/${meetupId}/vote`, { response });

/**
 * Mark meetup as completed
 */
export const completeMeetup = (meetupId) =>
    api.post(`/api/meetups/${meetupId}/complete`);

export default {
    createGroupMeetup,
    getGroupMeetups,
    getMeetup,
    activateMeetup,
    voteOnMeetup,
    completeMeetup,
};
