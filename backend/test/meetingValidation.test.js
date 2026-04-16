import { describe, it } from "node:test";
import assert from "node:assert/strict";

function validateHybridMeetup(body) {
    if (body.mode === "PHYSICAL" && !body.location) {
        throw new Error("Location is required for Physical meetups");
    }
    if (body.mode === "ONLINE" && !body.meetingLink) {
        throw new Error("Meeting link is required for Online meetups");
    }
    if (body.mode === "HYBRID" && (!body.location || !body.meetingLink)) {
        throw new Error("Both location and meeting link are required for Hybrid meetups");
    }
    return true;
}

describe("Meeting Validation Logic", () => {
    it("should invalidate HYBRID meeting missing link", () => {
        assert.throws(() => {
            validateHybridMeetup({ mode: "HYBRID", location: "Room 101", meetingLink: "" });
        }, /Both location and meeting link are required/);
    });

    it("should invalidate HYBRID meeting missing location", () => {
        assert.throws(() => {
            validateHybridMeetup({ mode: "HYBRID", location: "", meetingLink: "https://zoom.us" });
        }, /Both location and meeting link are required/);
    });

    it("should validate HYBRID meeting with both link and location", () => {
        assert.doesNotThrow(() => {
            validateHybridMeetup({ mode: "HYBRID", location: "Room 101", meetingLink: "https://zoom.us" });
        });
    });

    it("should validate ONLINE meeting with link", () => {
        assert.doesNotThrow(() => {
            validateHybridMeetup({ mode: "ONLINE", meetingLink: "https://zoom.us" });
        });
    });
});
