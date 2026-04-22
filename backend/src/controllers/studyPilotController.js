import { generateAIResponse } from '../services/aiService.js';
import { extractTextFromPDF } from '../services/pdfService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import StudyMaterial from '../models/StudyMaterial.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generatePilotMaterials = async (req, res) => {
    try {
        const actionType = req.body.actionType || 'Custom';
        const chatPrompt = req.body.chatPrompt || '';

        console.log(`[StudyPilot] Action: ${actionType} | Received files:`, req.files ? req.files.length : 0);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No PDF files uploaded. Please upload at least one PDF file."
            });
        }

        // 1. Extract text from PDFs using Worker Thread (via pdfService)
        let pdfText = "";
        for (const file of req.files) {
            const extracted = await extractTextFromPDF(file.buffer);
            pdfText += (typeof extracted === 'object' ? extracted.text : extracted) + "\n";
        }

        if (!pdfText.trim()) {
            return res.status(400).json({
                success: false,
                message: "Unable to extract text from PDFs. Please upload clear PDF files."
            });
        }

        // 2. Define System Rules
        let systemRules = "";

        if (actionType === "Summary") {
            systemRules = (
                'You are an expert tutor. Create a highly detailed summary suitable for absolute beginners. ' +
                'Output ONLY valid JSON in this exact format:' +
                '{"summaryTitle": "Main Title", "keyPoints": [{"title": "Concept Name", "description": "Very detailed deep explanation..."}], "detailedSummary": "Overall conclusion"}'
            );
        } else if (actionType === "Flashcards") {
            systemRules = (
                'Create highly effective flashcards based on the text. ' +
                'Output ONLY a valid JSON array of objects: [{"front": "Question or Term", "back": "Detailed Answer"}]'
            );
        } else if (actionType === "Quiz" || chatPrompt.toLowerCase().includes("quiz")) {
            systemRules = (
                `User request: "${chatPrompt}". You are an exam creator. Create a multiple choice quiz based on the provided text. ` +
                'Output ONLY a valid JSON array matching this exact format: ' +
                '[{"question": "Question text?", "options": {"A": "First option", "B": "Second option", "C": "Third option", "D": "Fourth option"}, "correctAnswers": ["A", "C"], "explanations": {"A": "Reason A", "B": "Reason B", "C": "Reason C", "D": "Reason D"}}]'
            );
        } else if (actionType === "Mindmap") {
            systemRules = `
You are an expert knowledge architect. Generate a highly structured, hierarchical mind map for the topic: "${chatPrompt}".
Output STRICTLY in this JSON format:
{
  "nodes": [{"id": "1", "data": {"label": "Main Topic"}}],
  "edges": [{"id": "e1-2", "source": "1", "target": "2"}]
}`;
        } else {
            systemRules = `Act as Study Pilot. User asked: "${chatPrompt}". Output ONLY valid JSON.`;
        }

        const userMessage = `
    [SOURCE DOCUMENT TEXT]
    ${pdfText.substring(0, 8000)}

    CRITICAL INSTRUCTION: Output strictly valid JSON.
        `;

        // 3. Generate AI Response (Uses AI Model Manager)
        let aiRawResponse = await generateAIResponse(systemRules, userMessage);
        
        // If AI returns a string, we parse it using Response Cleaner Worker
        let parsedData = aiRawResponse;
        if (typeof aiRawResponse === 'string') {
            const cleanerWorkerPath = path.resolve(__dirname, '../workers/responseCleaner.worker.js');
            parsedData = await new Promise((resolve, reject) => {
                const worker = new Worker(cleanerWorkerPath);
                worker.on('message', (msg) => {
                    if (msg.success) resolve(msg.data);
                    else resolve(msg.rawData); // Fallback to raw data if parsing fails
                });
                worker.on('error', (err) => resolve(aiRawResponse));
                worker.postMessage(aiRawResponse);
            });
        }

        // Auto-correct AI nesting
        const promptLower = chatPrompt.toLowerCase();
        if (actionType === "Flashcards" || actionType === "Quiz" || promptLower.includes("quiz")) {
            if (typeof parsedData === 'object' && !Array.isArray(parsedData)) {
                for (const val of Object.values(parsedData)) {
                    if (Array.isArray(val)) {
                        parsedData = val;
                        break;
                    }
                }
            }
        }

        // Save generated material to Database (StudyMaterial model)
        // const newMaterial = new StudyMaterial({
        //     userId: req.user.id, // Assuming auth middleware provides req.user
        //     title: `${actionType} for ${chatPrompt || 'Uploaded PDF'}`,
        //     type: actionType === "Mindmap" ? "MindMap" : actionType,
        //     content: parsedData
        // });
        // await newMaterial.save();

        res.status(200).json({
            success: true,
            data: parsedData
        });

    } catch (error) {
        console.error("StudyPilot Generation Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate study materials. Please try again."
        });
    }
};