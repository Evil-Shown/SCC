import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import multer from "multer";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Module from "./models/Module.js";
import KuppiPost from "./models/KuppiPost.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import kuppiRoutes from "./routes/kuppiRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import examRoutes from "./routes/examRoutes.js";


import studyPilotRoutes from "./routes/studyPilotRoutes.js"; 

import meetupRoutes from "./routes/meetupRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import moduleRoutes from "./routes/moduleRoutes.js";
import semesterTimetableRoutes from "./routes/semesterTimetableRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import pollRoutes from "./routes/pollRoutes.js";
import { startMeetupCancellationJob } from "./jobs/meetupJobs.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
];

const corsOriginHandler = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error("Not allowed by CORS"));
  }
};

// Middleware
app.use(
  cors({
    origin: corsOriginHandler,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Campus Companion API",
    version: "1.0.0",
  });
});

// Registering Routes
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    server: "ok",
    database: "connected",
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes (require DB)
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api", messageRoutes);
app.use("/api", fileRoutes);
app.use("/api", notesRoutes);
app.use("/api", kuppiRoutes);
app.use("/api", notificationRoutes);
app.use('/api/exams', examRoutes);


app.use('/api/study-pilot', studyPilotRoutes);

app.use("/api", meetupRoutes);
app.use("/api", timetableRoutes);
app.use("/api", resourceRoutes);
app.use("/api", moduleRoutes);
app.use("/api", semesterTimetableRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", pollRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 50MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Socket.io — same origin policy as Express (works with multiple dev ports)
const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined personal room`);
  });

  socket.on("join-group", (groupId) => {
    socket.join(`group-${groupId}`);
    console.log(`User joined group: ${groupId}`);
  });

  socket.on("leave-group", (groupId) => {
    socket.leave(`group-${groupId}`);
    console.log(`User left group: ${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.set("io", io);

const startJobs = async () => {
  const archiveExpiredKuppiPostsJob = async () => {
    try {
      const now = new Date();
      const result = await KuppiPost.updateMany(
        {
          isArchived: false,
          eventDate: { $lt: now },
        },
        {
          $set: {
            isArchived: true,
            archivedAt: now,
            archivedReason: "event-expired",
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Archived ${result.modifiedCount} expired kuppi posts`);
      }
    } catch (error) {
      console.error("Kuppi expiry job error:", error.message);
    }
  };

  await archiveExpiredKuppiPostsJob();
  setInterval(archiveExpiredKuppiPostsJob, 60 * 1000);

  startMeetupCancellationJob();
};

/**
 * Connect to MongoDB Atlas first, then start the HTTP server.
 * No API is served until the database is connected.
 */
const startServer = async () => {
  try {
    await connectDB();

    // Drop stale DB indexes (e.g. old unique on `name`) so they match User schema
    try {
      await User.syncIndexes();
      console.log("User collection indexes synced with schema");
    } catch (syncErr) {
      console.warn("User.syncIndexes:", syncErr.message);
    }

    try {
      await Module.syncIndexes();
      console.log("Module collection indexes synced with schema");
    } catch (syncErr) {
      console.warn("Module.syncIndexes:", syncErr.message);
    }

    await startJobs();

    const PORT = process.env.PORT || 5000;
    server
      .listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      })
      .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(
            `Port ${PORT} is already in use. Kill the other process or change PORT in .env`
          );
        } else {
          console.error("Server error:", err.message);
        }
        process.exit(1);
      });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

startServer();