import express from 'express';
import multer from 'multer';
import { generateExamPlan } from '../controllers/examPlanController.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//  upload.array('outlines') MUST be used here because the frontend is sending multiple files with the key 'outlines' in FormData.
//That is for read frontend form data & create req.body & req.files 
router.post('/setup', upload.array('outlines'), generateExamPlan); 

export default router;