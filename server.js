require('dotenv').config();
const connectDB = require('./src/config/db');
const app = require('./src/app');

const PORT = process.env.PORT || 10000;

connectDB()
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch(err => {
        console.error('Failed to start:', err.message);
        process.exit(1);
    });
