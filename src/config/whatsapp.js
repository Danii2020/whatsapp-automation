const { Client, LocalAuth } = require('whatsapp-web.js');

const clientConfig = {
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
};

const client = new Client(clientConfig);

module.exports = client; 