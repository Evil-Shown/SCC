import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer = null;

const toSafeMongoUriForLogs = (mongoUri) => {
  if (!mongoUri) return "";
  try {
    const u = new URL(mongoUri);
    // Keep only protocol + host + path; drop credentials and query.
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    // Fallback: redact credentials if present.
    return mongoUri.replace(/\/\/[^@]+@/i, "//***:***@");
  }
};

const shouldFallbackToInMemoryDb = () => {
  const v = process.env.USE_IN_MEMORY_DB;
  if (v === "true") return true;
  if (v === "false") return false;
  // Default: allow fallback in non-production so dev can boot offline.
  return (process.env.NODE_ENV || "development") !== "production";
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MongoDB URI is missing. Set MONGO_URI or MONGODB_URI in your environment.");
  }

  const connect = async (uri) => {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout instead of hanging
      connectTimeoutMS: 10000,
    });
    return conn;
  };

  try {
    const conn = await connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("  MongoDB Connection FAILED");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("  Error:", error.message);
    console.error("  Fix checklist:");
    console.error("  1. Go to MongoDB Atlas → Network Access");
    console.error("     Add your current IP address (or 0.0.0.0/0 for dev)");
    console.error("  2. Check your MONGO_URI credentials in backend/.env");
    console.error("     Current URI (redacted):", toSafeMongoUriForLogs(mongoUri));
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (shouldFallbackToInMemoryDb()) {
      try {
        console.warn("Falling back to an in-memory MongoDB for local development.");
        if (!memoryServer) {
          memoryServer = await MongoMemoryServer.create({
            instance: { dbName: "scc-dev" },
          });
        }
        const memUri = memoryServer.getUri();
        const conn = await connect(memUri);
        console.log(`In-memory MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (memErr) {
        throw new Error(
          `MongoDB connection failed: ${error.message}; in-memory fallback also failed: ${memErr?.message || memErr}`
        );
      }
    }

    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};

export default connectDB;
