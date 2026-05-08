const mongoose = require('mongoose');

const recruiterProfileSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phone:       { type: String, required: true },
  designation: { type: String, required: true },
  company:     { type: String, required: true },
  companySize: { type: String, required: true },
  industry:    { type: String, required: true },
  website:     { type: String, default: '' },
  city:        { type: String, required: true },
  linkedin:    { type: String, default: '' },
  completed:   { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('RecruiterProfile', recruiterProfileSchema);