const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleAuth, forgotPassword, resetPassword, updateProfile } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { profileParser } = require('../config/cloudinary');

router.post('/register', profileParser.single('avatar'), validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.post('/google', googleAuth);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.put('/profile', protect, profileParser.single('avatar'), updateProfile);

module.exports = router;
