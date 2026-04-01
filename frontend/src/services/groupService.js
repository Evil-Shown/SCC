import api from "./api";

export const createGroup = async (groupData) => {
  const response = await api.post("/api/groups", groupData);
  return response.data;
};

export const getGroups = async (params = {}) => {
  const response = await api.get("/api/groups", { params });
  return response.data;
};

export const getGroup = async (groupId) => {
  const response = await api.get(`/api/groups/${groupId}`);
  return response.data;
};

export const joinGroup = async (groupId) => {
  const response = await api.post(`/api/groups/${groupId}/join`);
  return response.data;
};

export const leaveGroup = async (groupId) => {
  const response = await api.post(`/api/groups/${groupId}/leave`);
  return response.data;
};

export const updateGroup = async (groupId, groupData) => {
  const response = await api.put(`/api/groups/${groupId}`, groupData);
  return response.data;
};

export const deleteGroup = async (groupId) => {
  const response = await api.delete(`/api/groups/${groupId}`);
  return response.data;
};

export const addMember = async (groupId, userId) => {
  const response = await api.post(`/api/groups/${groupId}/members`, { userId });
  return response.data;
};

export const removeMember = async (groupId, memberId) => {
  const response = await api.delete(`/api/groups/${groupId}/members/${memberId}`);
  return response.data;
};

/** Search users by name/email for invitations */
export const searchUsers = async (query, groupId = null) => {
  const params = { q: query };
  if (groupId) params.groupId = groupId;
  const response = await api.get("/api/groups/users/search", { params });
  return response.data;
};

/** Invite a user to a private group (leader/admin only) */
export const inviteMember = async (groupId, userId) => {
  const response = await api.post(`/api/groups/${groupId}/invite`, { userId });
  return response.data;
};
