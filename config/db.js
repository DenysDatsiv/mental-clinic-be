const mongoose = require('mongoose');

let cachedConnection = null; // Cache the database connection

const connectDB = async () => {
    if (cachedConnection) {
        console.log("✅ Using existing MongoDB connection.");
        return cachedConnection;
    }

    if (!process.env.MONGODB_URI) {
        console.error("❌ ERROR: Missing MONGODB_URI! Set it in Vercel.");
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        cachedConnection = conn; // Store connection in cache
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        throw new Error("Database connection failed");
    }
};

module.exports = connectDB;
