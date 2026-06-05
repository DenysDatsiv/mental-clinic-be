const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes      = require('./routes/auth.routes');
const testRoutes      = require('./routes/test.routes');
const articleRoutes   = require('./routes/article.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const errorHandler    = require('./middleware/error.middleware');

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const isLocalhost = (origin) => /^https?:\/\/localhost(:\d+)?$/.test(origin);

const corsOptions = {
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (isLocalhost(origin)) return cb(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
};

const app = express();
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/tests',     testRoutes);
app.use('/api/articles',  articleRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(errorHandler);

module.exports = app;
