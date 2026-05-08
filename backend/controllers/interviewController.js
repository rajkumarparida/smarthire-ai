const Application = require('../models/Application');
const Interview   = require('../models/Interview');

// ─────────────────────────────────────────────
//  START SESSION  (Candidate)
//  Creates / resets interview session record
// ─────────────────────────────────────────────
exports.startSession = async (req, res) => {
  try {
    const { jobId } = req.params;
    const application = await Application.findOne({
      job: jobId, candidate: req.user.id,
    });
    if (!application)
      return res.status(404).json({ message: 'Application not found' });
    if (application.stage !== 'interview')
      return res.status(400).json({ message: 'Not eligible for interview round' });

    // Upsert interview session
    const session = await Interview.findOneAndUpdate(
      { application: application._id },
      {
        application: application._id,
        candidate:   req.user.id,
        job:         jobId,
        status:      'in_progress',
        startedAt:   new Date(),
        facePresent: 0,
        faceAbsent:  0,
        tabSwitches: 0,
        snapshots:   [],
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: 'Session started', sessionId: session._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
//  HEARTBEAT  (Candidate pings every ~5 seconds)
//  Body: { faceDetected: true|false, tabSwitched: true|false }
// ─────────────────────────────────────────────
exports.heartbeat = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { faceDetected, tabSwitched } = req.body;

    const session = await Interview.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (faceDetected) session.facePresent++;
    else              session.faceAbsent++;
    if (tabSwitched)  session.tabSwitches++;

    session.snapshots.push({
      ts:          new Date(),
      facePresent: !!faceDetected,
      tabSwitch:   !!tabSwitched,
    });

    // Prune snapshots to last 200 entries (keep lightweight)
    if (session.snapshots.length > 200)
      session.snapshots = session.snapshots.slice(-200);

    await session.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
//  END SESSION  (Candidate submits)
//  Calculates mock integrity score, updates Application
// ─────────────────────────────────────────────
exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Interview.findById(sessionId)
      .populate('application');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const totalPings   = session.facePresent + session.faceAbsent || 1;
    const faceScore    = Math.round((session.facePresent / totalPings) * 100);
    const penaltyTabs  = Math.min(session.tabSwitches * 5, 40); // max 40-point penalty
    const integrityScore = Math.max(0, faceScore - penaltyTabs);

    session.status         = 'completed';
    session.completedAt    = new Date();
    session.integrityScore = integrityScore;
    await session.save();

    // Store on Application
    const app = session.application;
    app.interviewScore   = integrityScore;
    app.interviewRemarks =
      `Face presence: ${faceScore}%, Tab switches: ${session.tabSwitches}`;
    // Stage stays 'interview' — HR/recruiter advances in Round 3
    await app.save();

    res.json({
      integrityScore,
      faceScore,
      tabSwitches:   session.tabSwitches,
      message:       'Interview session recorded. Awaiting HR review.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
//  GET SESSION (Recruiter — view candidate data)
// ─────────────────────────────────────────────
exports.getSession = async (req, res) => {
  try {
    const session = await Interview.findById(req.params.sessionId)
      .populate('candidate', 'name email')
      .populate('job', 'title');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};