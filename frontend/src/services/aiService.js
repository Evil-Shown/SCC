import api from "./api";

export const getAiModels = async () => {
  const response = await api.get("/api/ai/models");
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to fetch AI models");
  }
  return response.data.data;
};

// Send a single message to the general AI assistant
export const sendAiMessage = async ({ message, model }) => {
  const response = await api.post("/api/ai/chat", { message, model });

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to get AI response");
  }

  return response.data.data.reply;
};

