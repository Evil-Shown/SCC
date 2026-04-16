import api from "./api";

// This file has all the functions to talk to our backend server about groups
// ── Groups CRUD ────────────────────────────────────────────

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

export const updateGroup = async (groupId, groupData) => {
  const response = await api.put(`/api/groups/${groupId}`, groupData);
  return response.data;
};

export const deleteGroup = async (groupId) => {
  const response = await api.delete(`/api/groups/${groupId}`);
  return response.data;
};

// ── Membership ─────────────────────────────────────────────

export const joinGroup = async (groupId) => {
  const response = await api.post(`/api/groups/${groupId}/join`);
  return response.data;
};

export const leaveGroup = async (groupId) => {
  const response = await api.post(`/api/groups/${groupId}/leave`);
  return response.data;
};

export const removeMember = async (groupId, memberId) => {
  const response = await api.delete(`/api/groups/${groupId}/members/${memberId}`);
  return response.data;
};

export const changeMemberRole = async (groupId, memberId, role) => {
  const response = await api.put(`/api/groups/${groupId}/members/${memberId}/role`, { role });
  return response.data;
};

export const transferOwnership = async (groupId, newOwnerId) => {
  const response = await api.post(`/api/groups/${groupId}/transfer-ownership`, { newOwnerId });
  return response.data;
};

// ── User search (invite autocomplete) ─────────────────────

export const searchUsers = async (query, groupId = null) => {
  const params = { q: query };
  if (groupId) params.groupId = groupId;
  const response = await api.get("/api/groups/users/search", { params });
  return response.data;
};

// ── Formal invites ─────────────────────────────────────────

/** Admin/owner sends a formal invite (creates pending invite record) */
export const sendGroupInvite = async (groupId, { userId, email } = {}) => {
  const response = await api.post(`/api/groups/${groupId}/invites`, { userId, email });
  return response.data;
};

/** Admin/owner fetches pending invites for a group */
export const getGroupInvites = async (groupId) => {
  const response = await api.get(`/api/groups/${groupId}/invites`);
  return response.data;
};

/** Admin/owner revokes a pending invite */
export const revokeGroupInvite = async (groupId, inviteId) => {
  const response = await api.patch(`/api/groups/${groupId}/invites/${inviteId}/revoke`);
  return response.data;
};

/** Invitee fetches their own pending invites */
export const getMyInvites = async () => {
  const response = await api.get("/api/groups/invites/me");
  return response.data;
};

/** Invitee accepts an invite */
export const acceptGroupInvite = async (inviteId) => {
  const response = await api.patch(`/api/groups/invites/${inviteId}/accept`);
  return response.data;
};

/** Invitee declines an invite */
export const declineGroupInvite = async (inviteId) => {
  const response = await api.patch(`/api/groups/invites/${inviteId}/decline`);
  return response.data;
};

// Backward-compat alias used by old MemberList (direct add = send invite)
export const inviteMember = async (groupId, userId) => sendGroupInvite(groupId, { userId });
export const addMember = async (groupId, userId) => sendGroupInvite(groupId, { userId });

// ── Activity log ───────────────────────────────────────────

export const getGroupActivity = async (groupId, params = {}) => {
  const response = await api.get(`/api/groups/${groupId}/activity`, { params });
  return response.data;
};
