const express = require('express');
const router = express.Router();
const mpesaController = require('../controllers/mpesaController');

// POST /api/mpesa/stkpush - Initiates payment prompt on user's phone
router.post('/stkpush', mpesaController.getAccessToken, mpesaController.triggerStkPush);

// POST /api/mpesa/callback - Receives confirmation from Safaricom servers
router.post('/callback', mpesaController.mpesaCallback);

module.exports = router;
