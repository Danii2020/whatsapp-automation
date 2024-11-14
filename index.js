const express = require('express');
const cors = require('cors');
const whatsappRoutes = require('./src/routes/whatsapp.routes');
const whatsappService = require('./src/services/whatsapp.service');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.use('/api', whatsappRoutes);

whatsappService.initialize();

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
}); 