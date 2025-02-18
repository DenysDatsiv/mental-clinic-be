require('dotenv').config();
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db'); // Correct path
const testRoutes = require('./routes/testRoutes');
const serverless = require('serverless-http'); // Required for Vercel

dotenv.config();

const app = express();

// Connect to MongoDB (ensuring connection is established before requests)
connectDB();

// Middleware
app.use(express.json());

// Enable CORS
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Routes
app.use('/api/tests', testRoutes);

// Export the app wrapped as a serverless function
module.exports = serverless(app);
