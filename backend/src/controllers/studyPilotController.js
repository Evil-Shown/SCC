import axios from 'axios';
import FormData from 'form-data';

export const generatePilotMaterials = async (req, res) => {
    try {
        const actionType = req.body.actionType || 'Custom';
        const chatPrompt = req.body.chatPrompt || '';
        
        const pythonFormData = new FormData();
        pythonFormData.append('actionType', actionType);
        pythonFormData.append('chatPrompt', chatPrompt);

        console.log(`[StudyPilot] Action: ${actionType} | Received files:`, req.files ? req.files.length : 0);

        // ආරක්‍ෂිත පියවර: ෆයිල් එක Node.js එකට ආවාදැයි බැලීම
        if (!req.files || req.files.length === 0) {
            console.error("No files received from React Frontend!");
            return res.status(400).json({ 
                success: false, 
                message: "No PDF files uploaded. Please upload at least one PDF file." 
            });
        }

        // PDF Files නිවැරදිව Python වෙත යැවීම
        req.files.forEach(file => {
            pythonFormData.append('outlines', file.buffer, {
                filename: file.originalname || 'document.pdf',
                contentType: file.mimetype || 'application/pdf',
                knownLength: file.size
            });
        });

        // Python Server එකට Request එක යැවීම
        const pythonResponse = await axios.post('http://localhost:8000/api/study-pilot', pythonFormData, {
            headers: { ...pythonFormData.getHeaders() }
        });

        // Python එකෙන් එන පණිවිඩය (JSON) කෙලින්ම React වෙත යැවීම
        res.status(200).json(pythonResponse.data);

    } catch (error) {
        console.error("Python Service Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Unable to contact AI Service. Check if Python server is running." });
    }
};