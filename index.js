const express = require('express');
const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cors = require('cors')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const qr = require('qr-image');

const app = express();
const port = process.env.PORT || 3000;

const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: 'session'
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
});

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

let lastQR = null;

client.on('qr', qr => {
    lastQR = qr;
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();

app.post('/send-message', upload.single('image'), (req, res) => {
    const { numbers, message } = req.body;
    const imageFilePath = req.file.path

    if (!numbers || !message || !imageFilePath) {
        return res.status(400).send('Faltan parámetros: numbers, message o image');
    }

    const media = MessageMedia.fromFilePath(imageFilePath);

    numbers .forEach(number => {
        const chatId = `${number}@c.us`;
        client.sendMessage(chatId, media, { caption: message })
            .then(response => {
                console.log(`Mensaje enviado a ${number}`);
            })
            .catch(error => {
                console.error(`No se pudo enviar el mensaje a ${number}:`, error);
            });
    });

    fs.unlinkSync(imageFilePath);

    res.send(`Mensaje enviado a los números: ${numbers}`);
});

app.get('/qr', (req, res) => {
    if (!lastQR) {
        return res.status(404).send('QR Code not available yet. Please wait for client initialization.');
    }

    try {
        const qr_svg = qr.image(lastQR, { type: 'png' });
        res.type('png');
        qr_svg.pipe(res);
    } catch (err) {
        res.status(500).send('Error generating QR code');
    }
});

app.get('/status', (req, res) => {
    res.json({
        connected: client.info ? true : false,
        lastQR: lastQR ? true : false
    });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
