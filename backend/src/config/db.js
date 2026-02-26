import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MongoDB URI is missing. Set MONGO_URI or MONGODB_URI in your environment.");
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected...`);
    return conn;
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};

export default connectDB;
