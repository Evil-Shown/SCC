import { createNvidiaChatCompletion, getNvidiaCompletionText } from "../config/nvidia.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

class AIModelManager {
    constructor() {
        this.models = [
            // Gemini 2.5 Flash සහ Pro Model දෙකම භාවිතා කරමු (PDF කියවීමට සහය දක්වයි)
            { name: "Gemini_2.5_Flash", call: (sys, user, file) => this.callGeminiModel("gemini-2.5-flash", sys, user, file) },
            { name: "Gemini_2.5_Pro", call: (sys, user, file) => this.callGeminiModel("gemini-2.5-pro", sys, user, file) },
            { name: "Llama_3_8B_Free", call: (sys, user, file) => this.callOpenRouterModel("meta-llama/llama-3-8b-instruct:free", sys, user, file) },
            { name: "Gemma_2_9B_Free", call: (sys, user, file) => this.callOpenRouterModel("google/gemma-2-9b-it:free", sys, user, file) },
            { name: "Mistral_7B_Free", call: (sys, user, file) => this.callOpenRouterModel("mistralai/mistral-7b-instruct:free", sys, user, file) },
            { name: "Nvidia_Llama", call: this.callNvidiaModel.bind(this) }
        ];
    }

    async callGeminiModel(modelId, systemPrompt, userMessage, fileBuffer = null) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing in .env");
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // systemInstruction හරහා systemPrompt ලබා දීම
        const model = genAI.getGenerativeModel({
            model: modelId,
            systemInstruction: systemPrompt
        });

        const parts = [];

        // PDF Buffer එකක් ඇත්නම් එය inlineData ලෙස එකතු කිරීම
        if (fileBuffer) {
            parts.push({
                inlineData: {
                    data: fileBuffer.toString("base64"),
                    mimeType: "application/pdf"
                }
            });
        }

        parts.push({ text: userMessage });

        const result = await model.generateContent(parts);
        return result.response.text();
    }

    async callOpenRouterModel(modelId, systemPrompt, userMessage, fileBuffer = null) {
        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error("OPENROUTER_API_KEY is missing in .env");
        }

        // OpenRouter Free Text models typically do not support PDF File Buffers directly.
        if (fileBuffer) {
            throw new Error(`Model ${modelId} does not support direct PDF buffer processing. Fallback needed.`);
        }

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: modelId,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data.choices[0].message.content;
    }

    async callNvidiaModel(systemPrompt, userMessage, fileBuffer = null) {
        const messages = [
            { role: "system", content: systemPrompt }
        ];

        // If your AI SDK supports file buffers, attach it here
        // e.g., converting to base64 or uploading via their Files API
        if (fileBuffer) {
            // Placeholder: Add file handling logic based on specific AI SDK
            // console.log("Attaching PDF Buffer to AI Request...");
            messages.push({ role: "user", content: "Attached PDF File Data: [Binary Data Omitted]. " + userMessage });
        } else {
            messages.push({ role: "user", content: userMessage });
        }

        const completion = await createNvidiaChatCompletion({
            messages,
            temperature: 1,
            top_p: 0.95,
            max_tokens: 16384
        });

        return getNvidiaCompletionText(completion);
    }

    // AI Model කිහිපයක් හරහා Fallback එකක් යැවීම (එකක් fail වුවහොත් අනික)
    async generateWithFallback(systemPrompt, userMessage, fileBuffer = null) {
        let lastError = null;

        for (const model of this.models) {
            try {
                console.log(`[AI Model Manager] අත්හදා බලමින් පවතී: ${model.name}`);
                // fileBuffer එක AI model එකට යැවීම
                const response = await model.call(systemPrompt, userMessage, fileBuffer);
                if (response) {
                    console.log(`[AI Model Manager] සාර්ථකයි: ${model.name}`);
                    return response;
                }
            } catch (error) {
                console.error(`[AI Model Manager] ${model.name} අසමත් විය:`, error.message);
                lastError = error;
                // ඊළඟ model එකට යයි
            }
        }

        throw new Error(`සියලුම AI Models අසමත් විය. අවසාන දෝෂය: ${lastError?.message}`);
    }
}

export default new AIModelManager();
