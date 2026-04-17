import { createNvidiaChatCompletion, getNvidiaCompletionText } from "../config/nvidia.js";

export const generateAIResponse = async (systemPrompt, userMessage) => {
  try {
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ];

    const completion = await createNvidiaChatCompletion({
      messages,
      temperature: 1,
      top_p: 0.95,
      max_tokens: 16384
    });

    const responseText = getNvidiaCompletionText(completion);

    // Try to parse as JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      // If not JSON, return as text
      return responseText;
    }
  } catch (error) {
    console.error("AI Service Error:", error);
    throw new Error("Failed to generate AI response");
  }
};