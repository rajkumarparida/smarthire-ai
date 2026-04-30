const Job = require('../models/Job');

// Recruiter: Create a job
exports.createJob = async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user.id });

    // ── Trigger email to all candidates (non-blocking) ──
    notifyAllCandidates(job);  // no await — runs in background

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Everyone: Get all active jobs
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true })
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Everyone: Get single job
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name email');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Recruiter: Get their own jobs
exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Recruiter: Delete a job
exports.deleteJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};