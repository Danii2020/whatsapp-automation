const mongoose = require('mongoose');
require('dotenv').config();

const mongoUsername = process.env.MONGO_USERNAME;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoCluster = process.env.MONGO_CLUSTER;
const mongoDatabase = process.env.MONGO_DATABASE;

const mongoUri = `mongodb+srv://${mongoUsername}:${mongoPassword}@${mongoCluster}.mongodb.net/${mongoDatabase}?retryWrites=true&w=majority`;

mongoose.set('debug', true);

const connectDB = async () => {
    try {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB; 