import api from "./api";

export const getExamOverview = async () => {
  const response = await api.get("/api/exams/overview");
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to fetch exam overview");
  }
  return response.data.data;
};

export const getUserExams = async () => {
  const response = await api.get("/api/exams");
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to fetch exams");
  }
  return response.data.data;
};

export const createExam = async (payload) => {
  const response = await api.post("/api/exams", payload);
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to create exam");
  }
  return response.data.data;
};

export const updateExam = async (examId, payload) => {
  const response = await api.patch(`/api/exams/${examId}`, payload);
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to update exam");
  }
  return response.data.data;
};

export const updateExamPreparation = async (examId, payload) => {
  const response = await api.patch(`/api/exams/${examId}/preparation`, payload);
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to update preparation tracker");
  }
  return response.data.data;
};

export const updateRoadmapDayStatus = async (examId, payload) => {
  const response = await api.patch(`/api/exams/${examId}/roadmap-status`, payload);
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to update roadmap day");
  }
  return response.data.data;
};

export const deleteExam = async (examId) => {
  const response = await api.delete(`/api/exams/${examId}`);
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to delete exam");
  }
  return true;
};

export const generateStudyRoadmap = async (payload) => {
  const response = await api.post("/api/exams/roadmap", payload);
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to generate roadmap");
  }
  return response.data.data;
};

export const generateAiStudyAssistant = async (formData) => {
  const response = await api.post("/api/exams/ai-assistant", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to generate AI study content");
  }

  return response.data.data;
};
