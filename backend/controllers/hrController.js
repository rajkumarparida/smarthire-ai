const Application = require('../models/Application');
const Interview   = require('../models/Interview');

// Valid decisions
const DECISIONS = ['selected', 'rejected', 'next_round'];

// ─────────────────────────────────────────────
//  GET HR REVIEW QUEUE  (Recruiter)
//  Returns all candidates in 'interview' stage for a job
//  (i.e. passed Round 1 AND completed Round 2)
// ─────────────────────────────────────────────
exports.getHRQueue = async (req, res) => {
  try {
    const { jobId } = req.params;

    const apps = await Application.find({
      job:   jobId,
      stage: 'interview',
    })
      .populate('candidate', 'name email')
      .populate('job', 'title company')
      .sort({ interviewScore: -1, examScore: -1 }); // highest scores first

    // Attach interview session data if available
    const appIds = apps.map(a => a._id);
    const sessions = await Interview.find({ application: { $in: appIds } })
      .select('application integrityScore facePresent faceAbsent tabSwitches completedAt status');

    const sessionMap = sessions.reduce((m, s) => {
      m[s.application.toString()] = s;
      return m;
    }, {});

    const enriched = apps.map(a => ({
      ...a.toObject(),
      interviewSession: sessionMap[a._id.toString()] || null,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
//  RECRUITER DECISION  (Recruiter)
//  Body: { decision: 'selected' | 'rejected' | 'next_round', remarks: '' }
// ─────────────────────────────────────────────
exports.makeDecision = async (req, res) => {
  try {
    const { appId } = req.params;
    const { decision, remarks = '' } = req.body;

    if (!DECISIONS.includes(decision))
      return res.status(400).json({
        message: `Invalid decision. Must be one of: ${DECISIONS.join(', ')}`,
      });

    const app = await Application.findById(appId).populate('candidate', 'name email');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    // Map decision to stage
    const stageMap = {
      selected:   'selected',
      rejected:   'rejected',
      next_round: 'interview',  // stays in interview for further rounds if needed
    };

    app.stage             = stageMap[decision];
    app.isShortlisted     = decision === 'selected';
    app.interviewRemarks  = remarks || app.interviewRemarks;

    // Final score = weighted average (exam 40% + interview 60%)
    const examW = app.examScore || 0;
    const intW  = app.interviewScore || 0;
    app.finalScore = Math.round(examW * 0.4 + intW * 0.6);

    await app.save();

    res.json({
      message:   `Candidate ${decision === 'selected' ? 'selected ✅' : decision === 'rejected' ? 'rejected ❌' : 'moved to next round ↗'}`,
      decision,
      stage:     app.stage,
      candidate: app.candidate?.name,
      finalScore: app.finalScore,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
//  BULK DECISION  (Recruiter)
//  Body: { appIds: [...], decision, remarks }
// ─────────────────────────────────────────────
exports.bulkDecision = async (req, res) => {
  try {
    const { appIds, decision, remarks = '' } = req.body;
    if (!DECISIONS.includes(decision))
      return res.status(400).json({ message: 'Invalid decision' });

    const stageMap = { selected:'selected', rejected:'rejected', next_round:'interview' };
    const ops = appIds.map(id =>
      Application.findByIdAndUpdate(id, {
        stage:            stageMap[decision],
        isShortlisted:    decision === 'selected',
        interviewRemarks: remarks,
      })
    );
    await Promise.all(ops);
    res.json({ message: `${appIds.length} candidates updated`, decision });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
//  GET FULL PIPELINE STATS  (Recruiter — dashboard summary)
// ─────────────────────────────────────────────
exports.getPipelineStats = async (req, res) => {
  try {
    const { jobId } = req.params;
    const stages = ['applied','exam','interview','selected','rejected'];
    const counts  = await Promise.all(
      stages.map(stage =>
        Application.countDocuments({ job: jobId, stage })
      )
    );
    const stats = stages.reduce((acc, stage, i) => {
      acc[stage] = counts[i];
      return acc;
    }, {});
    stats.total = counts.reduce((a, c) => a + c, 0);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};