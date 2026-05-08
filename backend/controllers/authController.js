const User = require('../models/User');
const OTP  = require('../models/OTP');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { isCompanyEmail } = require('../middleware/domainValidator');
const otpGenerator = require('otp-generator');

const phoneOtpStore = {};
const DEMO_OTP = '1234';    

exports.sendPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone required' });

    // Store demo OTP (expires in 10 min)
    phoneOtpStore[phone] = {
      otp: DEMO_OTP,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    console.log(`[Demo] Phone OTP for ${phone}: ${DEMO_OTP}`);

    res.json({ message: 'OTP sent (demo: use 1234)' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyPhoneOTP = async (req, res) => {
  const { phone, otp } = req.body;

  const record = phoneOtpStore[phone];
  if (!record) return res.status(400).json({ message: 'OTP not found. Click Send OTP first.' });
  if (Date.now() > record.expiresAt) return res.status(400).json({ message: 'OTP expired' });
  if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

  delete phoneOtpStore[phone];
  res.json({ success: true, message: 'Verified' });
};

// ── Email transporter ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ── Generate 6-digit OTP ──────────────────────────────────────────
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// ── OTP Email Template ────────────────────────────────────────────
const otpEmailTemplate = (otp, name) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body       { font-family: Arial, sans-serif; background: #f4f4f4; margin:0; padding:0; }
    .wrapper   { max-width:500px; margin:30px auto; background:#fff;
                 border-radius:10px; overflow:hidden;
                 box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header    { background:#4f46e5; padding:24px; text-align:center; }
    .header h2 { color:#fff; margin:0; font-size:20px; }
    .body      { padding:28px 32px; }
    .otp-box   { background:#f0f4ff; border:2px dashed #4f46e5;
                 border-radius:10px; text-align:center;
                 padding:24px; margin:20px 0; }
    .otp-code  { font-size:42px; font-weight:900; color:#4f46e5;
                 letter-spacing:10px; margin:0; }
    .expire    { color:#ef4444; font-size:13px; margin-top:8px; }
    .footer    { background:#f8fafc; padding:14px; text-align:center;
                 font-size:12px; color:#94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h2>🤖 SmartHire AI — OTP Login</h2>
    </div>
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your One-Time Password (OTP) for SmartHire AI login is:</p>
      <div class="otp-box">
        <p class="otp-code">${otp}</p>
        <p class="expire">⏱ Expires in 5 minutes</p>
      </div>
      <p style="color:#64748b; font-size:13px;">
        If you did not request this OTP, please ignore this email.
        Do not share this OTP with anyone.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} SmartHire AI
    </div>
  </div>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────────
// REGISTER (unchanged)
// ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ── Company email check for recruiters ──
    const domainCheck = isCompanyEmail(email, role);
    if (!domainCheck.valid)
      return res.status(400).json({ message: domainCheck.message });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ name, email, password: hashed, role });

    res.status(201).json({
      token: generateToken(user),
      role:  user.role,
      name:  user.name,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// STEP 1 — Send OTP to email
// ─────────────────────────────────────────────────────────────────
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    // ── Company email check for recruiters ──
    const domainCheck = isCompanyEmail(email, user.role);
    if (!domainCheck.valid)
      return res.status(400).json({ message: domainCheck.message });

    // rest of sendOTP stays exactly the same...
    await OTP.deleteMany({ email });
    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const hashedOTP = await bcrypt.hash(otp, 10);
    await OTP.create({ email, otp: hashedOTP, expiresAt });

    await transporter.sendMail({
      from:    `"SmartHire AI" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: '🔐 Your SmartHire AI Login OTP',
      html:    otpEmailTemplate(otp, user.name),
    });

    res.json({ message: `OTP sent to ${email}`, name: user.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// STEP 2 — Verify OTP and login
// ─────────────────────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP are required' });

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, used: false });
    if (!otpRecord)
      return res.status(400).json({ message: 'OTP not found or already used' });

    // Check expiry
    if (new Date() > otpRecord.expiresAt)
      return res.status(400).json({ message: 'OTP has expired. Please request a new one' });

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid OTP. Please try again' });

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    // Get user and return token
    const user = await User.findOne({ email });
    res.json({
      token: generateToken(user),
      role:  user.role,
      name:  user.name,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// LEGACY password login (keep as fallback)
// ─────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    res.json({ token: generateToken(user), role: user.role, name: user.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};