import express from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth.js';
import {
	createExam,
	deleteExam,
	generateAiStudyAssistant,
	generateExamPlan,
	generateStudyRoadmap,
	getExamOverview,
	getUserExams,
	updateExam,
	updatePreparationTracker,
	updateRoadmapDayStatus
} from '../controllers/examPlanController.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(authenticate);

router.get('/', getUserExams);
router.post('/', createExam);
router.get('/overview', getExamOverview);
router.post('/roadmap', generateStudyRoadmap);
router.post('/ai-assistant', upload.array('notes'), generateAiStudyAssistant);

//  upload.array('outlines') MUST be used here because the frontend is sending multiple files with the key 'outlines' in FormData.
//That is for read frontend form data & create req.body & req.files 
router.post('/setup', upload.array('outlines'), generateExamPlan); 
router.patch('/:examId/preparation', updatePreparationTracker);
router.patch('/:examId/roadmap-status', updateRoadmapDayStatus);
router.patch('/:examId', updateExam);
router.delete('/:examId', deleteExam);

export default router;