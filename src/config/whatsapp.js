const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');

const createWhatsAppClient = (store, clientId = null) => {
    const config = {
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000,
            ...(clientId && { clientId })
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    };

    return new Client(config);
};

let client;

const initializeClient = async () => {
    try {
        const mongoUsername = process.env.MONGO_USERNAME;
        const mongoPassword = process.env.MONGO_PASSWORD;
        const mongoCluster = process.env.MONGO_CLUSTER;
        console.log(mongoCluster);
        
        await mongoose.connect(`mongodb+srv://${mongoUsername}:${mongoPassword}@${mongoCluster}.mongodb.net/whatsapp-bot?retryWrites=true&w=majority`);

        const store = new MongoStore({ mongoose: mongoose });
        client = createWhatsAppClient(store);
        return client;
    } catch (error) {
        console.error('Failed to initialize WhatsApp client:', error);
        throw error;
    }
};

module.exports = { initializeClient, createWhatsAppClient };