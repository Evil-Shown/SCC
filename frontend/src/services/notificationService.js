import api from "./api";

export const getNotifications = async (params = {}) => {
  const response = await api.get("/api/notifications", { params });
  return response.data;
};

export const markAsRead = async (notificationId) => {
  const response = await api.patch(`/api/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.patch("/api/notifications/read-all");
  return response.data;
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
