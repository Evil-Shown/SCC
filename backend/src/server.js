import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import multer from "multer";
import connectDB from "./config/db.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import kuppiRoutes from "./routes/kuppiRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
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
    version: "1.0.0"
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api", messageRoutes);
app.use("/api", fileRoutes);
app.use("/api", notesRoutes);
app.use("/api", kuppiRoutes);
app.use("/api", notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 50MB"
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle user joining their personal room
  socket.on("join-room", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined personal room`);
  });

  // Handle user joining a group
  socket.on("join-group", (groupId) => {
    socket.join(`group-${groupId}`);
    console.log(`User joined group: ${groupId}`);
  });

  // Handle user leaving a group
  socket.on("leave-group", (groupId) => {
    socket.leave(`group-${groupId}`);
    console.log(`User left group: ${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Make io accessible in routes
app.set("io", io);

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;
    server
      .listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      })
      .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(`Port ${PORT} is already in use. Kill the other process or change PORT in .env`);
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
