const express = require('express');
const router  = express.Router();
const {
  register,
  login,
  sendOTP,
  verifyOTP,
  getProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { sendPhoneOTP, verifyPhoneOTP } = require('../controllers/authController');

router.post('/register',    register);
router.post('/login',       login);        // legacy fallback
router.post('/send-otp',    sendOTP);      // Step 1 → send OTP
router.post('/verify-otp',  verifyOTP);    // Step 2 → verify + login
router.get ('/profile',     protect, getProfile);
router.post('/send-phone-otp',   sendPhoneOTP);
router.post('/verify-phone-otp', verifyPhoneOTP);

module.exports = router;