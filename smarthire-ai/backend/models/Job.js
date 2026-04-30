const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  description:     { type: String, required: true },
  company:         { type: String, required: true },
  location:        { type: String },
  requiredSkills:  [{ type: String }],   // e.g. ["React", "Node.js", "MongoDB"]
  experienceLevel: { type: String, enum: ['fresher', 'junior', 'mid', 'senior'], default: 'fresher' },
  salary:          { type: String },     // e.g. "6-8 LPA"
  lastDate:        { type: Date },       // application deadline

  postedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive:        { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);