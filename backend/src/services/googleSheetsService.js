import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Attendance";

const getAuthClient = () => {
    const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return auth;
};

/**
 * Append attendance rows to Google Sheets.
 * Rows format: [Group Name, Meetup Title, Student Name, Status, Timestamp]
 * Returns { success, rowsAppended? } and NEVER throws — all errors are logged.
 */
export const appendAttendance = async ({ groupName, meetupTitle, attendees }) => {
    if (!SPREADSHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
        console.warn("[GoogleSheets] Configuration missing — skipping attendance sync.");
        return { success: false, reason: "not_configured" };
    }

    try {
        const auth = getAuthClient();
        const sheets = google.sheets({ version: "v4", auth });
        const timestamp = new Date().toISOString();

        const rows = attendees.map(({ name, status }) => [
            groupName,
            meetupTitle,
            name,
            status,
            timestamp,
        ]);

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:E`,
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",
            requestBody: { values: rows },
        });

        console.log(`[GoogleSheets] Appended ${rows.length} rows for "${meetupTitle}"`);
        return { success: true, rowsAppended: rows.length };
    } catch (error) {
        console.error("[GoogleSheets] appendAttendance error:", error.message);
        return { success: false, reason: error.message };
    }
};

/**
 * Ensure the header row exists in the sheet.
 * Called once at server startup; errors are non-fatal.
 */
export const ensureHeaders = async () => {
    if (!SPREADSHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) return;
    try {
        const auth = getAuthClient();
        const sheets = google.sheets({ version: "v4", auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A1:E1`,
        });
        if (!response.data.values?.length) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A1:E1`,
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: [["Group Name", "Meetup Title", "Student Name", "Attendance Status", "Timestamp"]],
                },
            });
            console.log("[GoogleSheets] Sheet headers initialized.");
        }
    } catch (error) {
        console.error("[GoogleSheets] ensureHeaders error:", error.message);
    }
};

export default { appendAttendance, ensureHeaders };
