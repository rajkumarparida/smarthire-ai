const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');

const { applyJob, myApplications, getApplicants } = require('../controllers/applicationController');
const { protect, recruiterOnly, candidateOnly }   = require('../middleware/authMiddleware');

// Multer config — save resume to /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only .txt and .pdf
    const allowed = ['.txt', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only .txt and .pdf allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

router.post('/:jobId/apply',     protect, candidateOnly, upload.single('resume'), applyJob);
router.get('/my-applications',   protect, candidateOnly,  myApplications);
router.get('/:jobId/applicants', protect, recruiterOnly,  getApplicants);
router.patch('/:appId/stage', protect, recruiterOnly, require('../controllers/applicationController').updateStage);

module.exports = router;