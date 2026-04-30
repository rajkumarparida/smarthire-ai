const express = require('express');
const router  = express.Router();
const { createJob, getAllJobs, getJobById, getMyJobs, deleteJob } = require('../controllers/jobController');
const { protect, recruiterOnly } = require('../middleware/authMiddleware');

router.get('/',            protect, getAllJobs);
router.get('/my-jobs',     protect, recruiterOnly, getMyJobs);
router.get('/:id',         protect, getJobById);
router.post('/',           protect, recruiterOnly, createJob);
router.delete('/:id',      protect, recruiterOnly, deleteJob);

module.exports = router;