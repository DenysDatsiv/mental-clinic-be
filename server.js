require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Connect to MongoDB
const testRoutes = require('./routes/testRoutes');

const app = express();

(async () => {
    await connectDB();
})();

app.use(express.json());

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Routes
app.use('/api/tests', testRoutes);

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

module.exports = app;
