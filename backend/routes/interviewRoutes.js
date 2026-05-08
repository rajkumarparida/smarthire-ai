const express = require('express');
const router  = express.Router();
const {
  startSession,
  heartbeat,
  endSession,
  getSession,
} = require('../controllers/interviewController');
const { protect, recruiterOnly, candidateOnly } = require('../middleware/authMiddleware');

// Candidate
router.post('/:jobId/start',          protect, candidateOnly, startSession);
router.post('/session/:sessionId/hb', protect, candidateOnly, heartbeat);
router.post('/session/:sessionId/end',protect, candidateOnly, endSession);

// Recruiter
router.get ('/session/:sessionId',    protect, recruiterOnly, getSession);

module.exports = router;