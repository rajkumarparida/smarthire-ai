const express    = require('express');
const router     = express.Router();
const { getOnboardingStatus, saveCandidateProfile, saveRecruiterProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.get ('/status',    protect, getOnboardingStatus);
router.post('/candidate', protect, saveCandidateProfile);
router.post('/recruiter', protect, saveRecruiterProfile);

module.exports = router;