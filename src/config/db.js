const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection) return cachedConnection;

    if (!process.env.MONGODB_URI) {
        throw new Error('Missing MONGODB_URI environment variable');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    cachedConnection = conn;
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
};

module.exports = connectDB;
