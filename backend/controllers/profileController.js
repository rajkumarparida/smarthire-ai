const CandidateProfile = require('../models/CandidateProfile');
const RecruiterProfile = require('../models/RecruiterProfile');

// Check if onboarding is completed
exports.getOnboardingStatus = async (req, res) => {
  try {
    const { id, role } = req.user;
    let profile = null;

    if (role === 'candidate') {
      profile = await CandidateProfile.findOne({ user: id });
    } else if (role === 'recruiter') {
      profile = await RecruiterProfile.findOne({ user: id });
    }

    res.json({
      completed: profile?.completed || false,
      profile: profile || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Save candidate onboarding
exports.saveCandidateProfile = async (req, res) => {
  try {
    const data = { ...req.body, user: req.user.id, completed: true };

    const profile = await CandidateProfile.findOneAndUpdate(
      { user: req.user.id },
      data,
      { upsert: true, new: true }
    );

    res.json({ message: 'Profile saved', profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Save recruiter onboarding
exports.saveRecruiterProfile = async (req, res) => {
  try {
    const data = { ...req.body, user: req.user.id, completed: true };

    const profile = await RecruiterProfile.findOneAndUpdate(
      { user: req.user.id },
      data,
      { upsert: true, new: true }
    );

    res.json({ message: 'Profile saved', profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};