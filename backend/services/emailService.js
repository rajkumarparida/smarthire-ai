const nodemailer = require('nodemailer');

// ── Transporter setup ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,  // Gmail App Password (not your real password)
  },
});

// ── Email template for new job ────────────────────────────────────
const jobEmailTemplate = (job, candidateName, jobLink) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body        { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .wrapper    { max-width: 600px; margin: 30px auto; background: #fff;
                  border-radius: 10px; overflow: hidden;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header     { background: #4f46e5; padding: 28px 32px; text-align: center; }
    .header h1  { color: #fff; margin: 0; font-size: 22px; }
    .header p   { color: #c7d2fe; margin: 6px 0 0; font-size: 14px; }
    .body       { padding: 28px 32px; }
    .greeting   { font-size: 16px; color: #1e293b; margin-bottom: 16px; }
    .job-card   { background: #f8fafc; border: 1px solid #e2e8f0;
                  border-radius: 8px; padding: 20px; margin: 20px 0; }
    .job-title  { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
    .job-meta   { font-size: 14px; color: #64748b; margin: 4px 0; }
    .skills     { margin-top: 12px; }
    .skill-tag  { display: inline-block; background: #ede9fe; color: #5b21b6;
                  padding: 3px 10px; border-radius: 99px; font-size: 12px;
                  margin: 3px 2px; }
    .cta        { text-align: center; margin: 28px 0 8px; }
    .cta a      { background: #4f46e5; color: #fff; padding: 13px 32px;
                  border-radius: 8px; text-decoration: none; font-size: 16px;
                  font-weight: 600; display: inline-block; }
    .footer     { background: #f8fafc; padding: 16px 32px; text-align: center;
                  font-size: 12px; color: #94a3b8;
                  border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🤖 SmartHire AI</h1>
      <p>New Job Opportunity Just For You!</p>
    </div>

    <div class="body">
      <p class="greeting">Hi ${candidateName},</p>
      <p style="color:#475569; font-size:15px;">
        A new job matching your profile has been posted on SmartHire AI.
        Check it out and apply before the deadline!
      </p>

      <div class="job-card">
        <p class="job-title">${job.title}</p>
        <p class="job-meta">🏢 ${job.company}</p>
        <p class="job-meta">📍 ${job.location || 'Not specified'}</p>
        <p class="job-meta">💼 ${job.experienceLevel}</p>
        <p class="job-meta">💰 ${job.salary || 'Not disclosed'}</p>
        ${job.lastDate ? `<p class="job-meta">📅 Apply by: ${new Date(job.lastDate).toDateString()}</p>` : ''}
        <div class="skills">
          ${job.requiredSkills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div>
      </div>

      <div class="cta">
        <a href="${jobLink}">View & Apply Now →</a>
      </div>

      <p style="color:#94a3b8; font-size:13px; text-align:center;">
        You're receiving this because you're registered as a candidate on SmartHire AI.
      </p>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} SmartHire AI — Automated Recruitment Platform
    </div>
  </div>
</body>
</html>
`;

// ── Send job notification to one candidate ────────────────────────
exports.sendJobNotification = async (candidateEmail, candidateName, job, jobLink) => {
  try {
    await transporter.sendMail({
      from:    `"SmartHire AI" <${process.env.EMAIL_USER}>`,
      to:      candidateEmail,
      subject: `🚀 New Job: ${job.title} at ${job.company}`,
      html:    jobEmailTemplate(job, candidateName, jobLink),
    });
    console.log(`✅ Email sent to ${candidateEmail}`);
  } catch (err) {
    // Don't crash the app if email fails
    console.error(`❌ Email failed for ${candidateEmail}:`, err.message);
  }
};

// ── Send to ALL candidates ────────────────────────────────────────
exports.notifyAllCandidates = async (job) => {
  try {
    const User    = require('../models/User');
    const candidates = await User.find({ role: 'candidate' }, 'name email');

    if (candidates.length === 0) {
      console.log('No candidates to notify.');
      return;
    }

    const jobLink = `${process.env.FRONTEND_URL}/candidate/jobs`;

    console.log(`📧 Sending job notification to ${candidates.length} candidates...`);

    // Send one by one (simple, no queue needed for MVP)
    for (const candidate of candidates) {
      await exports.sendJobNotification(
        candidate.email,
        candidate.name,
        job,
        jobLink
      );
    }

    console.log('✅ All notifications sent.');
  } catch (err) {
    console.error('❌ Notification error:', err.message);
  }
};