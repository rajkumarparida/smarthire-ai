// const express = require('express');
// const router  = express.Router();
// const { generateExam, getExam, submitExam } = require('../controllers/examController');
// const { protect, recruiterOnly, candidateOnly } = require('../middleware/authMiddleware');

// router.post('/:jobId/generate', protect, recruiterOnly, generateExam);
// router.get ('/:jobId',          protect, candidateOnly, getExam);
// router.post('/:jobId/submit',   protect, candidateOnly, submitExam);

// module.exports = router;

const express = require('express');
const router  = express.Router();
const { generateExam, getExam, submitExam } = require('../controllers/examController');
const { protect, recruiterOnly, candidateOnly } = require('../middleware/authMiddleware');

// Recruiter: generate exam for a job
router.post('/:jobId/generate', protect, recruiterOnly, generateExam);

// Candidate: fetch exam (answers hidden)
router.get ('/:jobId',          protect, candidateOnly, getExam);

// Candidate: submit exam (manual or auto)
router.post('/:jobId/submit',   protect, candidateOnly, submitExam);

module.exports = router;