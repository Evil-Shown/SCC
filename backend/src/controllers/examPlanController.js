import axios from 'axios';
import FormData from 'form-data';

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
        const systemRulesPrompt = `
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

        // 3. NEw formdata for send to Python api
        const pythonFormData = new FormData();
        
        //Prompt and other data attached 
        pythonFormData.append('systemPrompt', systemRulesPrompt); // Send pre defined Rules
        pythonFormData.append('planCategory', planCategory);
        pythonFormData.append('dailyHours', dailyHours);
        pythonFormData.append('modulesData', JSON.stringify(modulesData));

        // 4. Attach PDF files into python came from via Multer
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                pythonFormData.append('outlines', file.buffer, file.originalname);
            });
        }

        console.log("Sending data and rules to Python Microservice...");

        // 5. Send Request to Python FastAPI server via Axios
        const pythonResponse = await axios.post('http://localhost:8000/api/generate-plan', pythonFormData, {
            headers: {
                ...pythonFormData.getHeaders()
            }
        });

        // 6. send msg (came from python api) to frontend
        res.status(200).json({
            success: true,
            data: pythonResponse.data.data 
        });

    } catch (error) {
        console.error("Error communicating with Python AI Service:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "Study plan generation failed in microservice",
            error: error.message 
        });
    }
};