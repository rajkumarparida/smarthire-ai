const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema({
  ts:          { type: Date },
  facePresent: { type: Boolean },
  tabSwitch:   { type: Boolean },
}, { _id: false });

const interviewSchema = new mongoose.Schema({
  application:    { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  candidate:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job:            { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },

  status:         { type: String, enum: ['in_progress','completed','abandoned'], default: 'in_progress' },
  startedAt:      { type: Date },
  completedAt:    { type: Date },

  // Mock AI tracking metrics
  facePresent:    { type: Number, default: 0 },   // heartbeat ticks where face detected
  faceAbsent:     { type: Number, default: 0 },   // heartbeat ticks where face absent
  tabSwitches:    { type: Number, default: 0 },
  integrityScore: { type: Number, default: null }, // calculated on end

  snapshots:      [snapshotSchema],
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);