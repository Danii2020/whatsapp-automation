const express = require('express');
const { Client, MessageMedia, RemoteAuth } = require('whatsapp-web.js');
const cors = require('cors')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const qr = require('qr-image');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
require('dotenv').config()

const clients = new Map();

const app = express();
const port = process.env.PORT || 8000;


const mongoUsername = process.env.MONGO_USERNAME
const mongoPassword = process.env.MONGO_PASSWORD
const mongoCluster = process.env.MONGO_CLUSTER
const mongoDatabase = process.env.MONGO_DATABASE

const mongoUri = `mongodb+srv://${mongoUsername}:${mongoPassword}@${mongoCluster}.mongodb.net/${mongoDatabase}?retryWrites=true&w=majority`;

mongoose.set('debug', true);

const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

const clientSchema = new mongoose.Schema({
    clientId: { type: String, required: true, unique: true },
    sessionCollection: { type: String, required: true }
});

const ClientModel = mongoose.model('Client', clientSchema);

const getClientData = async (clientId) => {
    if (!mongoose.connection.readyState) {
        console.log('MongoDB connection not established. Connecting...');
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    }
    return await ClientModel.findOne({ clientId });
};

const saveClientInfo = async (clientId, sessionCollection) => {
    if (!mongoose.connection.readyState) {
        console.log('MongoDB connection not established. Connecting...');
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    }
    await ClientModel.findOneAndUpdate(
        { clientId },
        { clientId, sessionCollection },
        { upsert: true, new: true }
    );
};

const createClient = async (clientId) => {
    await mongoose.connect(mongoUri);

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

    if (!clients.has(clientId)) {
        clients.set(clientId, {});
    }

    const qrPromise = new Promise((resolve) => {
        client.on('qr', qr => {
            console.log(`QR Code received for client ${clientId}`);
            clients.get(clientId).qrCode = qr;
            resolve(qr);
        });
    });

    client.on('ready', () => {
        console.log(`Client ${clientId} is ready!`);
        clients.get(clientId).qrCode = null;
    });

    client.on('remote_session_saved', () => {
        console.log("Session saved!")
    });

    client.initialize();
    clients.set(clientId, {
        client,
        qrCode: null,
        qrPromise
    });
    await saveClientInfo(clientId, collectionName)

    return client;
};


app.use(express.json());
app.use(cors())

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, uniqueSuffix + extension);
    }
  });

const upload = multer({storage: storage });

app.post('/create-client/:clientId', async (req, res) => {
    const { clientId } = req.params;

    if (clients.has(clientId)) {
        return res.status(400).send('Client ID already exists in memory');
    }

    const existingClient = await getClientData(clientId);

    if (existingClient) {
        return res.status(400).send('Client ID already exists');
    }

    await createClient(clientId);
    res.send(`Client ${clientId} created successfully`);
});

app.get('/qr/:clientId', async (req, res) => {
    const { clientId } = req.params;
    const clientData = clients.get(clientId);
    if (clientData) {
        clientData.qrPromise.then((a) => console.log(a))
    }

    if (!clientData) {
        return res.status(404).send('Client not found');
    }

    try {
        const qrCode = await Promise.race([
            clientData.qrPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('QR Code generation timeout')), 30000)
            )
        ]);

        const qr_svg = qr.image(qrCode, { type: 'png' });
        res.type('png');
        qr_svg.pipe(res);
    } catch (err) {
        if (err.message === 'QR Code generation timeout') {
            res.status(408).send('QR Code generation timed out. Please try again.');
        } else {
            res.status(500).send('Error generating QR code');
        }
    }
});

app.post('/send-message-test/:clientId', (req, res) => {
    const { clientId } = req.params;
    const { numbers, message } = req.body;
    const clientData = clients.get(clientId);

    if (!clientData) {
        return res.status(404).send('Client not found');
    }

    if (!numbers || !message) {
        return res.status(400).send('Missing parameters: numbers, message or image');
    }

    numbers.forEach(number => {
        const chatId = `${number}@c.us`;
        clientData.client.sendMessage(chatId, { caption: message })
            .then(response => {
                console.log(`Message sent to ${number} from client ${response.from}`);
            })
            .catch(error => {
                console.error(`Could not send message to ${number} from client ${clientId}:`, error);
            });
    });
    res.send(`Message sent to numbers: ${numbers} from client ${clientId}`);
});

app.post('/send-message/:clientId', upload.single('image'), async (req, res) => {
    const { clientId } = req.params;
    const { numbers, message } = req.body;
    const imageFilePath = req.file.path;
    const clientData = clients.get(clientId);

    if (!clientData) {
        return res.status(404).send('Client not found');
    }

    if (!numbers || !message || !imageFilePath) {
        return res.status(400).send('Missing parameters: numbers, message or image');
    }

    const media = MessageMedia.fromFilePath(imageFilePath);

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const number of numbers) {
        const chatId = `${number}@c.us`;
        try {
            await clientData.client.sendMessage(chatId, media, { caption: message });
            console.log(`Message sent to ${number} from client ${clientId}`);
        } catch (error) {
            console.error(`Could not send message to ${number} from client ${clientId}:`, error);
        }
        await delay(2000);
    }

    fs.unlinkSync(imageFilePath);
    res.send(`Message sent to numbers: ${numbers} from client ${clientId}`);
});


const initializeClient = async (clientId) => {
    try {
        await mongoose.connect(mongoUri);

        const store = new MongoStore({ mongoose: mongoose });

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
        return client;
    } catch (error) {
        console.error('Failed to initialize WhatsApp client:', error);
        throw error;
    }
};

app.get('/create-session/:clientId', async (req, res) => {
    const { clientId } = req.params;
    const client = await initializeClient(clientId)
    try {
        if (!clients.has(clientId)) {
            clients.set(clientId, {});
        }
        const qrPromise = new Promise((resolve) => {
            client.on('qr', qr => {
                console.log(`QR Code received for client ${clientId}`);
                clients.get(clientId).qrCode = qr;
                resolve(qr);
            });
        });
        client.on('ready', () => {
            console.log(`Client ${clientId} is ready!`);
            clients.get(clientId).qrCode = null;
        });
        client.initialize();
        clients.set(clientId, {
            client,
            qrCode: null,
            qrPromise
        });
        if (client && clients.get(clientId)) {
            res.send({message: `Client ${clientId} initialized successfully`});
        } else {
            res.send({message: "Client not found, not initialiazed"})
        }
    } catch (error) {
        console.error('Failed to initialize WhatsApp client:', error);
        throw error;
    }
});

app.get('/status/:clientId', (req, res) => {
    const { clientId } = req.params;
    const clientData = clients.get(clientId);

    if (!clientData) {
        return res.status(404).send('Client not found');
    }

    res.json({
        connected: clientData.client.info ? true : false,
        qrCode: clientData.qrCode ? true : false
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
