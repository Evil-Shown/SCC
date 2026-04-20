import { generateAIResponse } from '../services/aiService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateExamPlan = async (req, res) => {
    try {
        console.log("Received request from Frontend to generate plan");

        // 1. User Data Processing with Worker Thread
        const userDataWorkerPath = path.resolve(__dirname, '../workers/userDataProcessor.worker.js');
        const userData = await new Promise((resolve, reject) => {
            const worker = new Worker(userDataWorkerPath);
            worker.on('message', (msg) => {
                if (msg.success) resolve(msg.data);
                else reject(new Error(msg.error));
            });
            worker.on('error', reject);
            worker.postMessage({
                modulesData: req.body.modulesData,
                planCategory: req.body.planCategory,
                scheduleData: req.body.scheduleData
            });
        });

        const { category, modulesArray, freeDaysArray } = userData;

        // 1. Frontend එකෙන් එන දත්ත
        const studentData = {
            planCategory: category, 
            modules: modulesArray,  
            schedule: freeDaysArray 
        };

        const currentDate = new Date().toISOString();

        // 2. අලුත් System Prompt එක
        const systemPrompt = `
You are an expert academic study planner. Your task is to generate a highly optimized, personalized study plan in a strict Mind Map JSON structure.

[CURRENT CONTEXT]
Today's Date: ${currentDate}
Plan Type: ${studentData.planCategory}

[USER PROFILE & CONSTRAINTS]
${JSON.stringify(studentData, null, 2)}

[SYSTEM RULES FOR GENERATION]
1. COUNTDOWN CALCULATION (CRITICAL): Compare "Today's Date" with each module's "examDate". Accurately calculate the exact time left (e.g., "14 Days, 5 Hours left"). This MUST be displayed in the module's details.
2. DAILY BREAKDOWN (THINGS TO DO): Do not just give random tasks. Break down the study plan chronologically day-by-day based on the provided "schedule" (free days). 
   - For each available day leading up to the exam, list specific "DAILY THINGS TO DO".
   - Stop generating daily tasks once the exact exam date is reached.
3. RESOURCE ALLOCATION: Assign more study time to "Hard" modules. Focus "Lab tests" on coding/practicals, "VIVA" on theories, and "FINAL" on past papers.
4. SCHEDULE COMPLIANCE: ONLY assign study tasks to the days specified in the "schedule" array. Respect the maximum "hours" available per day.

[OUTPUT FORMAT INSTRUCTIONS]
Generate a mind map style study plan. The output MUST be ONLY a strict, valid JSON object without any markdown wrapping (do not use \`\`\`json). 
Use the exact hierarchical structure below to show Modules -> Daily Plans -> Specific Tasks. Dynamically generate x,y coordinates to prevent overlapping:

{
  "id": "root",
  "type": "main",
  "data": { "label": "Exam Study Plan - ${studentData.planCategory}" },
  "position": { "x": 0, "y": 0 },
  "children": [
    {
      "id": "module_[ID]",
      "type": "subject",
      "data": { 
        "label": "[Module Name]", 
        "details": "Exam: [Date] | TIME LEFT: [X Days, Y Hours] | Type: [Type] | Diff: [Difficulty]" 
      },
      "position": { "x": 300, "y": -100 },
      "children": [
        {
          "id": "day_[DATE_OR_NAME]",
          "type": "daily_plan",
          "data": { 
            "label": "Date: [Specific Date] - [Allocated Hours] hrs" 
          },
          "position": { "x": 600, "y": -150 },
          "children": [
            { 
              "id": "task_[RANDOM]", 
              "type": "task", 
              "data": { 
                "label": "To-Do: [Specific actionable task, e.g., 'Do 2019 Past Paper']"
              }, 
              "position": { "x": 900, "y": -150 } 
            },
            { 
              "id": "task_[RANDOM]", 
              "type": "task", 
              "data": { 
                "label": "To-Do: [Another task for the same day]"
              }, 
              "position": { "x": 900, "y": -100 } 
            }
          ]
        }
      ]
    }
  ]
}
Ensure all IDs are completely unique. Provide ONLY the JSON.
`;

        const userMessage = `Please generate the study plan based on the provided rules.`;

        console.log("Generating AI response using Model Manager...");

        let aiRawResponse = await generateAIResponse(systemPrompt, userMessage);

        let parsedData = aiRawResponse;
        if (typeof aiRawResponse === 'string') {
            const cleanerWorkerPath = path.resolve(__dirname, '../workers/responseCleaner.worker.js');
            parsedData = await new Promise((resolve, reject) => {
                const worker = new Worker(cleanerWorkerPath);
                worker.on('message', (msg) => {
                    if (msg.success) resolve(msg.data);
                    else resolve(msg.rawData); 
                });
                worker.on('error', (err) => resolve(aiRawResponse));
                worker.postMessage(aiRawResponse);
            });
        }

        res.status(200).json({
            success: true,
            data: parsedData
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