const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  resumeUrl:  { type: String },          // uploaded resume file path
  skills:     [{ type: String }],        // parsed from resume (NLP step later)
  matchScore: { type: Number, default: 0 }, // AI skill match score (0–100)

  // Stage tracking
  stage: {
    type: String,
    enum: ['applied', 'exam', 'interview', 'selected', 'rejected'],
    default: 'applied'
  },

  // Exam result
  examScore:  { type: Number, default: null },
  examPassed: { type: Boolean, default: null },

  // Interview result
  interviewScore:   { type: Number, default: null },
  interviewRemarks: { type: String, default: '' },

  // Final
  finalScore: { type: Number, default: 0 }, // combined score
  isShortlisted: { type: Boolean, default: false },

}, { timestamps: true });

// Prevent a candidate from applying twice to the same job
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);