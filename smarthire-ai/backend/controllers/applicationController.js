const Application   = require('../models/Application');
const Job           = require('../models/Job');
const fs            = require('fs');
const { analyzeResume  } = require('../services/resumeAnalyzer');

// Candidate: Apply to a job with resume
exports.applyJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const existing = await Application.findOne({ job: jobId, candidate: req.user.id });
    if (existing) return res.status(400).json({ message: 'Already applied to this job' });

    let resumeText = '';
    let resumeUrl  = '';

    if (req.file) {
      resumeUrl  = `/uploads/${req.file.filename}`;
      resumeText = fs.readFileSync(req.file.path, 'utf-8');
    }

    // ── Run Full AI Resume Analysis ──
    const analysis = analyzeResume(resumeText, job.requiredSkills);

    const application = await Application.create({
      job:        jobId,
      candidate:  req.user.id,
      resumeUrl,
      skills:     analysis.details.extractedSkills,
      matchScore: analysis.finalScore,
    });

    res.status(201).json({
      message:    'Applied successfully',
      analysis,   // full report sent to frontend
      application,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Candidate: View their own applications
exports.myApplications = async (req, res) => {
  try {
    const apps = await Application.find({ candidate: req.user.id })
      .populate('job', 'title company location requiredSkills')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Recruiter: View all applicants for a job
exports.getApplicants = async (req, res) => {
  try {
    const apps = await Application.find({ job: req.params.jobId })
      .populate('candidate', 'name email')
      .sort({ matchScore: -1 }); // ranked by AI score
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Recruiter: manually update candidate stage
exports.updateStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const validStages = ['applied','exam','interview','selected','rejected'];
    if (!validStages.includes(stage))
      return res.status(400).json({ message: 'Invalid stage' });

    const app = await Application.findByIdAndUpdate(
      req.params.appId,
      { stage },
      { new: true }
    );
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};