const ClientService = require('../services/clientService');

class ClientController {
    constructor() {
        this.clientService = new ClientService();
        this.createClient = this.createClient.bind(this);
        this.getQR = this.getQR.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.getStatus = this.getStatus.bind(this);
    }

    async createClient(req, res) {
        try {
            const { clientId } = req.params;
            const response = await this.clientService.createClient(clientId);
            console.log(response)
            res.send(`Client ${clientId} created successfully`);
        } catch (error) {
            res.status(error.status || 500).send(error.message);
        }
    }

    async getQR(req, res) {
        try {
            const { clientId } = req.params;
            await this.clientService.generateQR(clientId, res);
        } catch (error) {
            if (error.message === 'QR Code generation timeout') {
                res.status(408).send('QR Code generation timed out. Please try again.');
            } else {
                res.status(500).send('Error generating QR code');
            }
        }
    }

    async sendMessage(req, res) {
        try {
            const { clientId } = req.params;
            const { numbers, message } = req.body;
            const imageFilePath = req.file?.path;
            
            await this.clientService.sendMessage(clientId, numbers, message, imageFilePath);
            
            res.send(`Message sent to numbers: ${numbers} from client ${clientId}`);
        } catch (error) {
            res.status(error.status || 500).send(error.message);
        }
    }

    async getStatus(req, res) {
        try {
            const { clientId } = req.params;
            const status = await this.clientService.getStatus(clientId);
            res.json(status);
        } catch (error) {
            res.status(error.status || 500).send(error.message);
        }
    }
}

module.exports = new ClientController();
