import api from "./api";

// Kuppi Posts
export const createKuppiPost = async (postData) => {
  const response = await api.post("/api/kuppi", postData);
  return response.data;
};

export const getKuppiPosts = async (params = {}) => {
  const response = await api.get("/api/kuppi", { params });
  return response.data;
};

export const updateKuppiPost = async (postId, postData) => {
  const response = await api.put(`/api/kuppi/${postId}`, postData);
  return response.data;
};

export const addMeetingLink = async (postId, meetingLink) => {
  const response = await api.patch(`/api/kuppi/${postId}/link`, { meetingLink });
  return response.data;
};

// Applications
export const applyToKuppi = async (postId) => {
  const response = await api.post("/api/kuppi/apply", { postId });
  return response.data;
};

export const getKuppiApplicants = async (postId) => {
  const response = await api.get(`/api/kuppi/applicants/${postId}`);
  return response.data;
};

export const exportApplicants = async (postId) => {
  const response = await api.get(`/api/kuppi/export/${postId}`, {
    responseType: "blob",
  });
  // Trigger download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `kuppi_applicants_${postId}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return { success: true };
};

export default {
  createKuppiPost,
  getKuppiPosts,
  updateKuppiPost,
  addMeetingLink,
  applyToKuppi,
  getKuppiApplicants,
  exportApplicants,
};
