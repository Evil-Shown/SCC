import dns from "node:dns";
import mongoose from "mongoose";

// Helps mongodb+srv SRV lookups on some Windows / restrictive DNS setups.
dns.setDefaultResultOrder("ipv4first");



const toSafeMongoUriForLogs = (mongoUri) => {
  if (!mongoUri) return "";
  try {
    const u = new URL(mongoUri);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return mongoUri.replace(/\/\/[^@]+@/i, "//***:***@");
  }
};

/**
 * Connect to MongoDB Atlas cluster only. No local/in-memory database fallback.
 */
const connectDB = async () => {
  // Fix Node.js resolving to 127.0.0.1 for DNS on some Windows setups that breaks mongodb+srv
  const extraDns = (process.env.MONGO_DNS_SERVERS || "").trim();
  if (extraDns) {
    const servers = extraDns.split(",").map((s) => s.trim()).filter(Boolean);
    if (servers.length) dns.setServers(servers);
  }

  let mongoUri = (process.env.MONGO_URI || process.env.MONGODB_URI || "").trim();

  if (!mongoUri) {
    throw new Error("MongoDB URI is missing. Set MONGO_URI or MONGODB_URI in your environment.");
  }

  // Common .env mistake: MONGO_URI=MONGO_URI=mongodb+srv://...
  if (mongoUri.startsWith("MONGO_URI=")) {
    mongoUri = mongoUri.slice("MONGO_URI=".length).trim();
  }
  if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
    throw new Error(
      "MONGO_URI must start with mongodb:// or mongodb+srv://. Check backend/.env for a typo (e.g. duplicate MONGO_URI=)."
    );
  }

  const connect = async (uri) => {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      family: 4, // Force IPv4 — avoids issues on dual-stack Windows
    });
    return conn;
  };

  try {
    const conn = await connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("  MongoDB Atlas Connection FAILED");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("  Error:", error.message);
    console.error("  Fix checklist:");
    console.error("  1. Go to MongoDB Atlas → Network Access");
    console.error("     Add your current IP address (or 0.0.0.0/0 for dev)");
    console.error("  2. Check your MONGO_URI credentials in backend/.env");
    console.error("     Current URI (redacted):", toSafeMongoUriForLogs(mongoUri));
    if (/querySrv|ECONNREFUSED|ENOTFOUND|getaddrinfo/i.test(String(error.message))) {
      console.error("  3. DNS/SRV fix: add to backend/.env → MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1");
      console.error("     Or use Atlas → Connect → Drivers → Standard connection string (no mongodb+srv).");
    }
    console.error("  3. Ensure your MongoDB cluster is active and running");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    throw new Error(`MongoDB Atlas connection failed: ${error.message}`);
  }
};

export default connectDB;
