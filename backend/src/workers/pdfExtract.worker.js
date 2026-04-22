import { parentPort } from 'worker_threads';
import vision from '@google-cloud/vision';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Google Vision API Key එක ලබා දීම
const keyFilename = path.resolve(__dirname, '../config/google-vision-key.json');
const client = new vision.ImageAnnotatorClient({ keyFilename });

parentPort.on('message', async (fileBuffer) => {
    try {
        // PDF File එක base64 වලට convert කර Google Vision API එකට යැවීම
        const request = {
            requests: [
                {
                    inputConfig: {
                        mimeType: 'application/pdf',
                        content: Buffer.from(fileBuffer).toString('base64'),
                    },
                    features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
                },
            ],
        };

        const [result] = await client.batchAnnotateFiles(request);
        
        if (!result.responses || result.responses.length === 0) {
            throw new Error("No response from Google Vision API");
        }

        const responses = result.responses[0].responses;
        let extractedText = '';

        if (responses) {
            for (const response of responses) {
                if (response.fullTextAnnotation) {
                    extractedText += response.fullTextAnnotation.text + '\n';
                }
            }
        }

        if (!extractedText.trim()) {
            throw new Error("Could not extract any text from the PDF");
        }

        // නිමාවූ පසු Main Thread එකට යැවීම
        parentPort.postMessage({ success: true, text: extractedText });
    } catch (error) {
        // දෝෂයක් ආවොත් Main Thread එකට දැනුම් දීම
        parentPort.postMessage({ success: false, error: error.message });
    }
});
