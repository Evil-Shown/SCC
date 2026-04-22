import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import aiModelManager from './aiModelManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const extractTextFromPDF = async (fileBuffer) => {
    try {
        console.log("✓ Step 1: Extracting raw text from PDF using Google Vision API via Worker...");

        // Pass the fileBuffer to the new pdfExtract worker
        const rawText = await new Promise((resolve, reject) => {
            const workerPath = path.resolve(__dirname, '../workers/pdfExtract.worker.js');
            const worker = new Worker(workerPath);

            worker.on('message', (message) => {
                if (message.success) resolve(message.text);
                else reject(new Error(message.error));
            });

            worker.on('error', reject);
            worker.on('exit', (code) => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });

            worker.postMessage(fileBuffer);
        });

        console.log("✓ Step 2: Cleaning AI extracted content via Worker...");
        const cleanedText = await new Promise((resolve, reject) => {
            const workerPath = path.resolve(__dirname, '../workers/pdfProcessor.worker.js');
            const worker = new Worker(workerPath);

            worker.on('message', (message) => {
                if (message.success) resolve(message.text);
                else reject(new Error(message.error));
            });

            worker.on('error', reject);
            worker.on('exit', (code) => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });

            worker.postMessage(rawText);
        });

        return cleanedText;

    } catch (error) {
        console.error("✗ Error in PDF Processing Service:", error.message);
        throw new Error("Failed to process PDF file.");
    }
};