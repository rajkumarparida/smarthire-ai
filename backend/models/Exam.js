const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options:  [{ type: String }],           // 4 options
  answer:   { type: Number, required: true } // index of correct option (0-3)
});

const examSchema = new mongoose.Schema({
  job:         { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  duration:    { type: Number, default: 15 },  // minutes
  passMark:    { type: Number, default: 50 },  // % to pass
  questions:   [questionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);