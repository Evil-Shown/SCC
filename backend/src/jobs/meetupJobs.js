import { autoCancelOverdueMeetups } from "../services/meetupService.js";

/**
 * Auto-cancel meetup job — runs on setInterval (every hour).
 * Using setInterval for consistency with existing Kuppi expiry job pattern in server.js.
 */
export const startMeetupCancellationJob = () => {
    const ONE_HOUR_MS = 60 * 60 * 1000;

    const runJob = async () => {
        console.log("[MeetupJob] Running auto-cancellation check...");
        try {
            const cancelled = await autoCancelOverdueMeetups();
            if (cancelled > 0) {
                console.log(`[MeetupJob] Auto-cancelled ${cancelled} overdue meetup(s).`);
            }
        } catch (error) {
            console.error("[MeetupJob] Error:", error.message);
        }
    };

    // Run once immediately on startup, then every hour
    runJob();
    setInterval(runJob, ONE_HOUR_MS);

    console.log("[MeetupJob] Auto-cancellation job started (runs every hour).");
};
