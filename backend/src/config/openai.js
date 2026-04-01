import axios from "axios";

// Supports OpenAI-compatible providers (e.g. OpenRouter) via env override.
// IMPORTANT: don't read env into a constant at module-load time,
// because ESM imports can run before `dotenv.config()` executes.
const getOpenAIBaseUrl = () => {
  return process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
};

export const OPENAI_CHAT_MODELS = [
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini (fast/cheap)" },
  { id: "gpt-4.1", label: "GPT-4.1 (best quality)" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "gpt-4o", label: "GPT-4o" }
];

export const getDefaultChatModel = () => {
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
};

export const isAllowedChatModel = (modelId) => {
  return OPENAI_CHAT_MODELS.some((m) => m.id === modelId);
};

export const assertOpenAIConfigured = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error("OPENAI_API_KEY is not configured on the server");
    err.status = 500;
    throw err;
  }
  return apiKey;
};

export const createChatCompletion = async ({
  model = getDefaultChatModel(),
  messages,
  temperature = 0.4
}) => {
  const apiKey = assertOpenAIConfigured();

  const response = await axios.post(
    `${getOpenAIBaseUrl()}/chat/completions`,
    {
      model,
      messages,
      temperature
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data;
};

export const getChatCompletionText = (data) => {
  return data?.choices?.[0]?.message?.content ?? null;
};

