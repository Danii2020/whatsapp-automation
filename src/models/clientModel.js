const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    clientId: { type: String, required: true, unique: true },
    sessionCollection: { type: String, required: true }
});

module.exports = mongoose.model('Client', clientSchema); 