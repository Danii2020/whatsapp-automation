const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const clientController = require('../controllers/clientController');

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, uniqueSuffix + extension);
    }
});

const upload = multer({ storage: storage });

router.post('/create-client/:clientId', clientController.createClient);
router.get('/qr/:clientId', clientController.getQR);
router.post('/send-message/:clientId', upload.single('image'), clientController.sendMessage);
router.get('/status/:clientId', clientController.getStatus);

module.exports = router;
