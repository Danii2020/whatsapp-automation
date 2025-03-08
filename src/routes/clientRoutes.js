const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

router.post('/create-client/:clientId', clientController.createClient);
router.get('/qr/:clientId', clientController.getQR);
router.post('/send-message/:clientId', clientController.sendMessage);
router.get('/status/:clientId', clientController.getStatus);

module.exports = router;
