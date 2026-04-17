import api from "./api"; // Assuming api.js is the axios instance

export const createPoll = async (groupId, data) => {
    const res = await api.post(`/api/groups/${groupId}/polls`, data);
    return res.data.poll;
};

export const getGroupPolls = async (groupId) => {
    const res = await api.get(`/api/groups/${groupId}/polls`);
    return res.data.polls;
};

export const votePoll = async (pollId, optionIds) => {
    const res = await api.post(`/api/polls/${pollId}/vote`, { optionIds });
    return res.data.poll;
};

export const updatePoll = async (pollId, data) => {
    const res = await api.put(`/api/polls/${pollId}`, data);
    return res.data.poll;
};

export const deletePoll = async (pollId) => {
    const res = await api.delete(`/api/polls/${pollId}`);
    return res.data;
};
