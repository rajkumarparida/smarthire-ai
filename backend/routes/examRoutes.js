const express = require('express');
const router  = express.Router();
const { generateExam, getExam, submitExam } = require('../controllers/examController');
const { protect, recruiterOnly, candidateOnly } = require('../middleware/authMiddleware');

router.post('/:jobId/generate', protect, recruiterOnly, generateExam);
router.get ('/:jobId',          protect, candidateOnly, getExam);
router.post('/:jobId/submit',   protect, candidateOnly, submitExam);

module.exports = router;