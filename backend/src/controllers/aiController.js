import {
  assertOpenAIConfigured,
  createChatCompletion,
  getChatCompletionText,
  OPENAI_CHAT_MODELS,
  getDefaultChatModel,
  isAllowedChatModel
} from "../config/openai.js";

export const getAiModels = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        models: OPENAI_CHAT_MODELS,
        defaultModel: getDefaultChatModel()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch AI models",
      error: error.message
    });
  }
};

/**
 * General AI chat endpoint.
 * POST /api/ai/chat
 *
 * Body:
 * { message: string }
 */
export const chatWithAI = async (req, res) => {
  try {
    const { message, model } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "message is required and must be a string"
      });
    }

    try {
      assertOpenAIConfigured();
    } catch (e) {
      return res.status(e.status || 500).json({
        success: false,
        message: e.message || "OpenAI is not configured"
      });
    }

    const selectedModel = model || getDefaultChatModel();
    if (model && !isAllowedChatModel(model)) {
      return res.status(400).json({
        success: false,
        message: "Invalid model selected",
        data: {
          allowedModels: OPENAI_CHAT_MODELS.map((m) => m.id)
        }
      });
    }

    const systemPrompt =
      "You are a friendly AI study assistant for university students. " +
      "Answer clearly and concisely, and when helpful, suggest how they can " +
      "organize their time or tasks.";

    const data = await createChatCompletion({
      model: selectedModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.4
    });

    const reply = getChatCompletionText(data);

    if (!reply) {
      return res.status(500).json({
        success: false,
        message: "AI did not return a usable response"
      });
    }

    return res.status(200).json({
      success: true,
      message: "AI response generated",
      data: {
        reply
      }
    });
  } catch (error) {
    console.error("AI chat error:", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to process AI chat message",
      error: error?.response?.data || error.message
    });
  }
};

