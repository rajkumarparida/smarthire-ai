const express = require('express');
const router  = express.Router();
const {
  getHRQueue,
  makeDecision,
  bulkDecision,
  getPipelineStats,
} = require('../controllers/hrController');
const { protect, recruiterOnly } = require('../middleware/authMiddleware');

// All HR routes are recruiter-only
router.get ('/:jobId/queue',       protect, recruiterOnly, getHRQueue);
router.get ('/:jobId/pipeline',    protect, recruiterOnly, getPipelineStats);
router.patch('/:appId/decision',   protect, recruiterOnly, makeDecision);
router.post ('/bulk-decision',     protect, recruiterOnly, bulkDecision);

module.exports = router;