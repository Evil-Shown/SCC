import express from 'express';
import upload from '../middlewares/upload.js'; // import upload middlewar
import { generatePilotMaterials } from '../controllers/examAiController.js';

const router = express.Router();

// 'outlines'  docs catch and send to the controller
router.post('/generate', upload.array('outlines'), generatePilotMaterials);

export default router;