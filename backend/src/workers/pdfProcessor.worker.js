import { parentPort } from 'worker_threads';

// AI Model එක හරහා extract කර එවන ලද දත්ත පිරිසිදු කිරීම සහ ව්‍යූහගත කිරීම පමණි
parentPort.on('message', (extractedText) => {
    try {
        if (typeof extractedText !== 'string') {
            throw new Error("Input must be a string");
        }

        let cleanText = extractedText;
        
        // සාමාන්‍ය පිරිසිදු කිරීම් (Cleaning extracted content)
        // උදාහරණයක් ලෙස: අමතර හිස් පේළි ඉවත් කිරීම, spaces හරිගැස්සීම
        cleanText = cleanText.replace(/\n\s*\n/g, '\n'); 
        cleanText = cleanText.trim();

        // නිමාවූ පසු Main Thread එකට යැවීම
        parentPort.postMessage({ success: true, text: cleanText });
    } catch (error) {
        // දෝෂයක් ආවොත් Main Thread එකට දැනුම් දීම
        parentPort.postMessage({ success: false, error: error.message });
    }
});
