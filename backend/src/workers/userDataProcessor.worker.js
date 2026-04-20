import { parentPort } from 'worker_threads';

// පරිශීලකයාගේ input දත්ත (modules, dates) ව්‍යූහගත කිරීම (Structuring)
parentPort.on('message', (userData) => {
    try {
        const { modulesData, planCategory, scheduleData } = userData;

        const parsedModules = typeof modulesData === 'string' ? JSON.parse(modulesData) : modulesData;
        const parsedSchedule = typeof scheduleData === 'string' ? JSON.parse(scheduleData) : scheduleData;

        // If user unselected days, Calculate as Busy day
        const freeDaysArray = parsedSchedule.map(s => {
            if (s.isFree) {
                return { day: s.day, hours: s.hours };
            } else {
                return { day: s.day, hours: 0, status: "Busy day" };
            }
        });

        // Main Thread එකට අවශ්‍ය වෙන structure එක සකසා යැවීම
        parentPort.postMessage({
            success: true,
            data: {
                category: planCategory || 'Official',
                modulesArray: parsedModules,
                freeDaysArray: freeDaysArray
            }
        });

    } catch (error) {
        parentPort.postMessage({ success: false, error: error.message });
    }
});
