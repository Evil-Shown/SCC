import { parentPort } from 'worker_threads';

// AI මගින් එන text එක පිරිසිදු කර JSON බවට පත් කිරීම
parentPort.on('message', (aiResponseText) => {
    try {
        let cleanText = aiResponseText;

        // Markdown block ඉවත් කිරීම (උදා: ```json ... ```)
        if (cleanText.includes('```json')) {
            cleanText = cleanText.split('```json')[1];
            if (cleanText.includes('```')) {
                cleanText = cleanText.split('```')[0];
            }
        } else if (cleanText.includes('```')) {
            cleanText = cleanText.replace(/```/g, '');
        }

        cleanText = cleanText.trim();

        // JSON string එක parse කිරීම
        const parsedJSON = JSON.parse(cleanText);

        parentPort.postMessage({ success: true, data: parsedJSON });

    } catch (error) {
        // JSON parse කිරීමට නොහැකි වුවහොත් මුල් text එකම යැවීම
        parentPort.postMessage({
            success: false,
            error: "JSON Parsing Failed",
            rawData: aiResponseText
        });
    }
});
