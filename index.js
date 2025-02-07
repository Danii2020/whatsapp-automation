const express = require('express');
const cors = require('cors');
const fs = require('fs');
const connectDB = require('./src/config/database');
const clientRoutes = require('./src/routes/clientRoutes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api', clientRoutes);

// Connect to MongoDB
connectDB();

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
