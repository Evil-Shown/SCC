import express from 'express';
import upload from '../middlewares/upload.js'; // upload middleware එක import කිරීම
import { generatePilotMaterials } from '../controllers/studyPilotController.js';

const router = express.Router();

// 'outlines' නමින් එන ගොනු අල්ලාගෙන controller එකට යැවීම
router.post('/generate', upload.array('outlines'), generatePilotMaterials);

export default router;