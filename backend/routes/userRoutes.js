const express = require('express');
const router = express.Router();
const { hireBroker, getBrokers, getMe } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.put('/hire-broker', protect, hireBroker);
router.get('/brokers', protect, getBrokers);
router.get('/me', protect, getMe);

module.exports = router;
