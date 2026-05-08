const mongoose = require('mongoose');

const candidateProfileSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phone:      { type: String, required: true },
  gender:     { type: String, enum: ['male','female','other'], required: true },
  dob:        { type: Date, required: true },
  city:       { type: String, required: true },
  skills:     [{ type: String }],
  education:  { type: String, required: true },
  college:    { type: String, required: true },
  university:  { type: String, required: true },
  passingYear:{ type: String, required: true },
  experience: { type: String, default: 'fresher' },
  resumeUrl:  { type: String, default: '' },
  linkedin:   { type: String, default: '' },
  github:     { type: String, default: '' },
  completed:  { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('CandidateProfile', candidateProfileSchema);