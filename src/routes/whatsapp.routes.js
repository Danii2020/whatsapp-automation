const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');

router.post('/send-message', whatsappController.sendMessage);
router.get('/qr', whatsappController.getQR);

module.exports = router;
