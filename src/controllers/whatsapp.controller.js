const whatsappService = require('../services/whatsapp.service');

class WhatsAppController {
    async sendMessage(req, res) {
        const { number, message } = req.body;

        if (!number || !message) {
            return res.status(400).send('Number or message is missing');
        }

        try {
            await whatsappService.sendMessage(number, message);
            console.log(`Message sent to ${number}`);
            return res.status(200).send('Message sent');
        } catch (error) {
            console.error(`Unable to send message to ${number}:`, error);
            return res.status(500).send('Error sending message');
        }
    }

    getQR(req, res) {
        const lastQR = whatsappService.getLastQR();
        
        if (!lastQR) {
            return res.status(404).send('QR Code not available yet. Please wait for client initialization.');
        }

        try {
            const qr_svg = whatsappService.generateQRImage(lastQR);
            res.type('png');
            qr_svg.pipe(res);
        } catch (err) {
            res.status(500).send('Error generating QR code');
        }
    }
}

module.exports = new WhatsAppController(); 