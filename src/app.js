const express = require('express');
const cors = require('cors');
const authRoutes    = require('./routes/auth.routes');
const testRoutes    = require('./routes/test.routes');
const articleRoutes = require('./routes/article.routes');
const errorHandler  = require('./middleware/error.middleware');

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/tests',    testRoutes);
app.use('/api/articles', articleRoutes);

app.use(errorHandler);

module.exports = app;
