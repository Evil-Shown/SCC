// examAiController.js දැන් ප්‍රධාන වශයෙන් AI Model Pool සහ අනෙකුත් පොදු AI සේවා (General AI functions) සඳහා භාවිතා කළ හැක.
// Exam Plan සහ Study Pilot සඳහා වෙනම Controllers දෙකක් (examPlanController සහ studyPilotController) සාදා ඇත.

import { generateAIResponse } from '../services/aiService.js';
import aiModelManager from '../services/aiModelManager.js';

export const checkAIHealth = async (req, res) => {
    try {
        // AI Model Manager හරහා සෞඛ්‍ය පරීක්ෂාවක් (Health check)
        const response = await aiModelManager.generateWithFallback("Reply with 'OK'", "Test Connection");
        
        res.status(200).json({
            success: true,
            message: "AI Model Pool is completely working.",
            data: response
        });
    } catch (error) {
        console.error("AI Pool Error:", error);
        res.status(500).json({
            success: false,
            message: "All AI Models in the pool are failing.",
            error: error.message
        });
    }
};