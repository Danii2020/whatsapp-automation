const qrcode = require('qrcode-terminal');
const qr = require('qr-image');
const client = require('../config/whatsapp');

let lastQR = null;

class WhatsAppService {
    initialize() {
        client.on('qr', this.handleQR);
        client.on('ready', this.handleReady);
        client.initialize();
    }

    handleQR(qr) {
        lastQR = qr;
        qrcode.generate(qr, { small: true });
    }

    handleReady() {
        console.log('Client is ready!');
    }

    async sendMessage(number, message) {
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