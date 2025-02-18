const mongoose = require('mongoose');

let isConnected = false; // Prevent multiple connections in serverless

const connectDB = async () => {
    if (isConnected) {
        console.log("✅ Using existing MongoDB connection.");
        return;
    }

    if (!process.env.MONGODB_URI) {
        console.error("❌ ERROR: Missing MONGODB_URI! Set it in Vercel.");
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI); // No extra options needed in Mongoose v6+
        isConnected = conn.connections[0].readyState === 1;
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};
console.log("🔍 MONGODB_URI:", process.env.MONGODB_URI);

module.exports = connectDB;
