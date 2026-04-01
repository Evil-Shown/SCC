import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "./models/User.js";

const MONGO_URI = process.env.MONGO_URI;

const seedUser = {
    name: "Test User",
    email: "test@scc.com",
    password: "password123",
    role: "student",
    studentId: "STU001",
    department: "Computer Science",
    year: 2,
};

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB Connected");

        // Remove existing test user if exists
        await User.deleteOne({ email: seedUser.email });

        // Create new user (password will be hashed by the pre-save hook)
        const user = new User(seedUser);
        await user.save();

        console.log("\n🎉 Test user created successfully!");
        console.log("─────────────────────────────────");
        console.log(`📧 Email    : ${seedUser.email}`);
        console.log(`🔑 Password : ${seedUser.password}`);
        console.log(`👤 Name     : ${seedUser.name}`);
        console.log(`🏫 Role     : ${seedUser.role}`);
        console.log("─────────────────────────────────\n");

    } catch (err) {
        console.error("❌ Seed error:", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("MongoDB Disconnected");
        process.exit(0);
    }
}

seed();
