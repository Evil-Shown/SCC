import aiModelManager from './aiModelManager.js';

export const generateAIResponse = async (systemPrompt, userMessage) => {
    try {
        console.log("[AI Service] Requesting AI Model Manager...");
        
        // aiModelManager හරහා Fallback ක්‍රමයට AI Response එක ගැනීම
        const responseText = await aiModelManager.generateWithFallback(systemPrompt, userMessage);
        
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