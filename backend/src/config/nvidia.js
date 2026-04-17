import axios from "axios";

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

export const NVIDIA_MODELS = [
  { id: "nvidia/nemotron-3-super-120b-a12b", label: "Nemotron 3 Super 120B" }
];

export const getDefaultNvidiaModel = () => {
  return process.env.NVIDIA_MODEL || "nvidia/nemotron-3-super-120b-a12b";
};

export const assertNvidiaConfigured = () => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    const err = new Error("NVIDIA_API_KEY is not configured on the server");
    err.status = 500;
    throw err;
  }
  return apiKey;
};

export const createNvidiaChatCompletion = async ({
  model = getDefaultNvidiaModel(),
  messages,
  temperature = 1,
  top_p = 0.95,
  max_tokens = 16384
}) => {
  const apiKey = assertNvidiaConfigured();

  const response = await axios.post(
    `${NVIDIA_BASE_URL}/chat/completions`,
    {
      model,
      messages,
      temperature,
      top_p,
      max_tokens
    },
    {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data;
};

export const getNvidiaCompletionText = (completion) => {
  return completion.choices[0]?.message?.content || "";
};