require('dotenv').config(); // Load environment variables

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Connect to MongoDB
const testRoutes = require('./routes/testRoutes');

const app = express();

// Connect to MongoDB before handling requests
(async () => {
    await connectDB();
})();

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

// Start the server
const PORT = process.env.PORT || 10000; // Ensure the port matches Render
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

module.exports = app; // Export for testing if needed
