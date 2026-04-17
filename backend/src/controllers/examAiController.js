import { generateAIResponse } from '../services/aiService.js';
import { extractTextFromPDF } from '../services/pdfService.js';

export const generateExamPlan = async (req, res) => {
    try {
        console.log("Received request from Frontend to generate plan");

        const body = req.body || {};

        // 1. JSON Data
        const modulesData = req.body.modulesData ? JSON.parse(req.body.modulesData) : [];
        const planCategory = req.body.planCategory || 'Official';
        const dailyHours = req.body.dailyHours || 4;

        let subjectsString = modulesData.map(m => `${m.id} ${m.name}`).join(', ');
        let allTopics = modulesData.map(m => (m.topics ? m.topics.join(', ') : '')).join(' | ');

        // 2. Pre-defined System Rules & Prompt
        const systemPrompt = `
          Create a personalized study plan for an upcoming exam.
          Plan Type: ${planCategory}
          Modules: ${subjectsString || 'Not specified'}
          Coverage Topics: ${allTopics || 'General syllabus'}
          Daily Hours: ${dailyHours}

          [PRE-DEFINED SYSTEM RULES]
          1. OFFICIAL AND NON-OFFICIAL are MAIN 2 categories of study plan.
             - Official [High priority]: Need fast-possible plan for limited time period.
             - Non-official [After-official]: User added for pre-preparation early.
             - Non-official Plans should automatically be removed/overwritten when Official Plans come for the same Module ID.
          2. Module Outline Pdf: Use extracted text to get Information about the Module Core and boundaries.
          3. Date And Time: Calculate how much days/time left accurately.
          4. Difficulty Level student knows about Module:
             - Easy: 80% student knows (Allocate less time)
             - Medium: 50% student knows (Allocate average time)
             - Noob: less than 50% student knows (Allocate maximum time and fundamentals)
          5. Cover topics: Focus strictly on the provided topics for each exam type.
          6. Daily commitment Hours: Use the average student commitment hours provided.
          7. MULTI-MODULE BALANCE: Generate a study plan to cover EVERY module the user added (Balanced plan). Calculate processes for Official and Non-Official separately.

          Generate a mind map style study plan in JSON format. The output MUST be a strict JSON object with the following structure:
          {
            "id": "root",
            "type": "main",
            "data": { "label": "Exam Study Plan" },
            "position": { "x": 0, "y": 0 },
            "children": [
              {
                "id": "subject1",
                "type": "subject",
                "data": { "label": "Subject 1" },
                "position": { "x": 200, "y": -100 },
                "children": [
                  { "id": "topic1", "type": "topic", "data": { "label": "Topic 1" }, "position": { "x": 400, "y": -150 } }
                ]
              }
            ]
          }
          Use unique IDs for all nodes. Return strictly valid JSON.
        `;

        // 3. Extract PDF contents
        let pdfContents = {};
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const extractedText = await extractTextFromPDF(file.buffer);
                pdfContents[file.originalname] = extractedText;
            }
        }

        // 4. Prepare user message
        const userMessage = `
    [EXTRACTED PDF OUTLINES / SYLLABUS TEXT]
    ${JSON.stringify(pdfContents)}

    Please generate the study plan based on the above PDF context and the provided rules.
        `;

        console.log("Generating AI response...");

        // 5. Generate AI response
        const result = await generateAIResponse(systemPrompt, userMessage);

        // 6. Send response to frontend
        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("Error generating exam plan:", error);
        res.status(500).json({
            success: false,
            message: "Study plan generation failed",
            error: error.message
        });
    }
};

export const generatePilotMaterials = async (req, res) => {
    try {
        const actionType = req.body.actionType || 'Custom';
        const chatPrompt = req.body.chatPrompt || '';

        console.log(`[StudyPilot] Action: ${actionType} | Received files:`, req.files ? req.files.length : 0);

        // Check for files
        if (!req.files || req.files.length === 0) {
            console.error("No files received from React Frontend!");
            return res.status(400).json({
                success: false,
                message: "No PDF files uploaded. Please upload at least one PDF file."
            });
        }

        // Extract text from PDFs
        let pdfText = "";
        let allImageDescriptions = [];
        
        for (const file of req.files) {
            const extracted = await extractTextFromPDF(file.buffer);
            
            // Handle both string (old format) and object (new format)
            if (typeof extracted === 'string') {
                pdfText += extracted + "\n";
            } else if (extracted && typeof extracted === 'object') {
                pdfText += (extracted.text || "") + "\n";
                if (extracted.imageDescriptions && Array.isArray(extracted.imageDescriptions)) {
                    allImageDescriptions.push(...extracted.imageDescriptions);
                }
            }
        }

        // Combine text and image descriptions for context
        if (allImageDescriptions.length > 0) {
            pdfText += "\n\n=== Image/Diagram Information ===\n";
            allImageDescriptions.forEach((desc, idx) => {
                pdfText += `${idx + 1}. ${desc.description}\n`;
            });
        }

        if (!pdfText.trim()) {
            return res.status(400).json({
                success: false,
                message: "Unable to extract text from PDFs. Please upload clear PDF files."
            });
        }

        // Define system rules based on action type
        let systemRules = "";

        if (actionType === "Summary") {
            systemRules = (
                'You are an expert tutor. Create a highly detailed summary suitable for absolute beginners. ' +
                'Deeply explain all key concepts, formulas, and necessary parts found in the text(If have). ' +
                'Do NOT just list bullet point, write full, descriptive explanations for each point so someone reading it for the first time can learn it completely.' +
                'Output ONLY valid JSON in this exact format:' +
                '{"summaryTitle": "Main Title", "keyPoints": [{"title": "Concept Name", "description": "Very detailed deep explanation..."}], "detailedSummary": "Overall conclusion"}'
            );
        } else if (actionType === "Flashcards") {
            systemRules = (
                'Create highly effective flashcards based on the text. ' +
                'every key concept, formula, and necessary part should be included in a flashcard.' +
                'Output ONLY a valid JSON array of objects: [{"front": "Question or Term", "back": "Detailed Answer"}]'
            );
        } else if (actionType === "Quiz" || chatPrompt.toLowerCase().includes("quiz") || chatPrompt.toLowerCase().includes("mcq")) {
            systemRules = (
                `User request: "${chatPrompt}". You are an exam creator. Create a multiple choice quiz based on the provided text. ` +
                'RULES: 1. If the user requested a specific number of questions in their prompt, generate exactly that many (Maximum 50). ' +
                'If no number is specified, generate between 5 and 20 questions depending on the length of the text. ' +
                '2. EVERY question MUST have EXACTLY 4 options. ' +
                '3. Multiple correct answers are allowed (e.g., ["Option A", "Option C"]). ' +
                '4. You MUST provide a brief explanation for EVERY option (why it is correct or incorrect). ' +
                '5. Each question Corrected answere/ers  show as"Correct answere is/are (e.g., ["Option A", "Option C"]) with brief explanation ' +
                'Output ONLY a valid JSON array matching this exact format: ' +
                '[{"question": "Question text?", "options": {"A": "First option", "B": "Second option", "C": "Third option", "D": "Fourth option"}, "correctAnswers": ["A", "C"], "explanations": {"A": "Reason A", "B": "Reason B", "C": "Reason C", "D": "Reason D"}}]'
            );
        } else if (actionType === "Mindmap") {
            systemRules = `
You are an expert knowledge architect.

Generate a highly structured, hierarchical mind map for the topic: "${chatPrompt}".

Rules:
1. Identify a single central root node.
2. Create primary branches (level 1), then expand into level 2 and level 3 where relevant.
3. Maintain strict hierarchy (parent → child relationships).
4. Avoid duplication and ensure full topic coverage.
5. Use concise labels (max 3–5 words per node).
6. Include examples/use-cases as leaf nodes where applicable.
7. Keep balanced depth across branches.
8. Ensure logical grouping and clear semantic relationships.

Output STRICTLY in this JSON format (no extra text):

{
  "nodes": [
    {"id": "1", "data": {"label": "Main Topic"}},
    {"id": "2", "data": {"label": "Branch 1"}},
    {"id": "3", "data": {"label": "Sub-branch 1.1"}}
  ],
  "edges": [
    {"id": "e1-2", "source": "1", "target": "2"},
    {"id": "e2-3", "source": "2", "target": "3"}
  ]
}

Constraints:
- Root node must always have id "1".
- IDs must be unique strings.
- Edges must correctly represent hierarchy (parent → child).
- Do NOT output explanations, only JSON.

Create a knowledge map. Output ONLY valid JSON: {"nodes": [{"id": "1", "data": {"label": "Topic"}}], "edges": [{"id": "e1", "source": "1", "target": "2"}]}
`.replace("{chatPrompt}", chatPrompt);
        } else {
            systemRules = `Act as Study Pilot. User asked: "${chatPrompt}". Output ONLY valid JSON.`;
        }

        // Prepare user message
        const userMessage = `
    [SOURCE DOCUMENT TEXT]
    ${pdfText.substring(0, 8000)}

    CRITICAL INSTRUCTION:
    1. Output strictly valid JSON.
    2. Do NOT include greetings, explanations, or any text outside of the JSON object/array.
    3. Keys MUST be enclosed in double quotes. Do NOT leave trailing commas.
        `;

        // Generate AI response
        let parsedData = await generateAIResponse(systemRules, userMessage);

        // Auto-correct AI nesting for Flashcards and Quiz
        const promptLower = chatPrompt.toLowerCase();
        if (actionType === "Flashcards" || actionType === "Quiz" || promptLower.includes("quiz") || promptLower.includes("mcq")) {
            if (typeof parsedData === 'object' && !Array.isArray(parsedData)) {
                for (const val of Object.values(parsedData)) {
                    if (Array.isArray(val)) {
                        parsedData = val;
                        break;
                    }
                }
            }
        }

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