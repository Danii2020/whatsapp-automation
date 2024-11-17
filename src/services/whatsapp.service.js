const qrcode = require('qrcode-terminal');
const qr = require('qr-image');
const { initializeClient } = require('../config/whatsapp');

let lastQR = null;
let client = null;

class WhatsAppService { 
    async initialize() {
        try {
            client = await initializeClient();

            client.on('qr', this.handleQR);
            client.on('ready', this.handleReady);

            await client.initialize();
        } catch (error) {
            console.error('Error initializing WhatsApp service:', error);
            throw error;
        }
    }

    handleQR(qr) {
        lastQR = qr;
        qrcode.generate(qr, { small: true });
    }

    handleReady() {
        console.log('Client is ready!');
    }

    async sendMessage(number, message) {
        if (!client) {
            throw new Error('WhatsApp client not initialized');
        }
        const chatId = `${number}@c.us`;
        return await client.sendMessage(chatId, message);
    }

    getLastQR() {
        return lastQR;
    }

    generateQRImage(qrCode) {
        return qr.image(qrCode, { type: 'png' });
    }
}

module.exports = new WhatsAppService();