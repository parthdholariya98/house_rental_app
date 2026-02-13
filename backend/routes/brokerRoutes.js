const express = require('express');
const router = express.Router();
const { getMyClients } = require('../controllers/brokerController');
const { protect, verifyRole } = require('../middleware/authMiddleware');

router.get('/clients', protect, verifyRole(['broker']), getMyClients);

module.exports = router;
