import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Poll from "../src/models/Poll.js";

describe("Poll Validation Logic", () => {
    it("should invalidate poll with less than 2 options", async () => {
        const poll = new Poll({
            groupId: new mongoose.Types.ObjectId(),
            creatorId: new mongoose.Types.ObjectId(),
            question: "What is your favorite color?",
            options: [{ text: "Red" }] // only 1 option
        });

        try {
            await poll.validate();
            assert.fail("Should have thrown validation error");
        } catch (err) {
            assert.ok(err.errors["options"]);
            assert.match(err.errors["options"].message, /A poll must have at least 2 options/);
        }
    });

    it("should validate poll with 2 or more options", async () => {
        const poll = new Poll({
            groupId: new mongoose.Types.ObjectId(),
            creatorId: new mongoose.Types.ObjectId(),
            question: "What is your favorite color?",
            options: [{ text: "Red" }, { text: "Blue" }]
        });

        try {
            await poll.validate();
            assert.ok(true, "Validation passed");
        } catch (err) {
            assert.fail("Should not throw validation error");
        }
    });
});
