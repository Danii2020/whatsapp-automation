const { Client, MessageMedia, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qr = require('qr-image');
const ClientModel = require('../models/clientModel');

class ClientService {
    constructor() {
        this.clients = new Map();
    }

    async createClient(clientId) {
        if (this.clients.has(clientId)) {
            return { status: 200, message: 'Client ID already exists in memory' };
        }

        const collectionName = `sessions_${clientId}`;
        const store = new MongoStore({
            mongoose: mongoose,
            collectionName: collectionName,
        });

        const client = new Client({
            authStrategy: new RemoteAuth({
                store: store,
                backupSyncIntervalMs: 300000,
                clientId: clientId
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
                    '--disable-gpu',
                ],
            },
        });

        if (!this.clients.has(clientId)) {
            this.clients.set(clientId, {});
        }

        const qrPromise = new Promise((resolve) => {
            client.on('qr', qr => {
                console.log(`QR Code received for client ${clientId}`);
                this.clients.get(clientId).qrCode = qr;
                resolve(qr);
            });
        });

        client.on('ready', () => {
            console.log(`Client ${clientId} is ready!`);
            this.clients.get(clientId).qrCode = null;
            return { status: 200, message: 'Client is ready' };

        });

        client.on('remote_session_saved', () => {
            console.log("Session saved!")
        });

        client.initialize();
        this.clients.set(clientId, {
            client,
            qrCode: null,
            qrPromise
        });

        await ClientModel.findOneAndUpdate(
            { clientId },
            { clientId, sessionCollection: collectionName },
            { upsert: true, new: true }
        );

        return client;
    }

    async generateQR(clientId, res) {
        const clientData = this.clients.get(clientId);
        if (!clientData) {
            throw { status: 404, message: 'Client not found' };
        }

        const qrCode = await Promise.race([
            clientData.qrPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('QR Code generation timeout')), 30000)
            )
        ]);

        const qr_svg = qr.image(qrCode, { type: 'png' });
        res.type('png');
        qr_svg.pipe(res);
    }

    async sendMessage(clientId, numbers, message, imageUrl = null) {
        console.log(numbers, message)
        const clientData = this.clients.get(clientId);
        if (!clientData) {
            throw { status: 404, message: 'Client not found' };
        }

        if (!numbers || !message) {
            throw { status: 400, message: 'Missing parameters: numbers or message' };
        }

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (const number of numbers) {
            const chatId = `${number}@c.us`;
            try {
                if (imageUrl) {
                    const media = await MessageMedia.fromUrl(imageUrl);
                    await clientData.client.sendMessage(chatId, media, { caption: message });
                } else {
                    await clientData.client.sendMessage(chatId, message);
                }
                console.log(`Message sent to ${number} from client ${clientId}`);
                await delay(2000);
            } catch (error) {
                console.error(`Could not send message to ${number} from client ${clientId}:`, error);
            }
        }
    }

    async getStatus(clientId) {
        const clientData = this.clients.get(clientId);
        if (!clientData) {
            throw { status: 404, message: 'Client not found' };
        }

        return {
            connected: clientData.client.info ? true : false,
            qrCode: clientData.qrCode ? true : false
        };
    }
}

module.exports = ClientService; 