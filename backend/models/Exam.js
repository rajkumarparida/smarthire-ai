// const mongoose = require('mongoose');

// const questionSchema = new mongoose.Schema({
//   question: { type: String, required: true },
//   options:  [{ type: String }],           // 4 options
//   answer:   { type: Number, required: true } // index of correct option (0-3)
// });

// const examSchema = new mongoose.Schema({
//   job:         { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
//   createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   title:       { type: String, required: true },
//   duration:    { type: Number, default: 15 },  // minutes
//   passMark:    { type: Number, default: 50 },  // % to pass
//   questions:   [questionSchema],
// }, { timestamps: true });

// module.exports = mongoose.model('Exam', examSchema);

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question:  { type: String, required: true },
  options:   [{ type: String }],          // 4 choices
  answer:    { type: Number, required: true }, // index of correct option
  category:  { type: String, enum: ['aptitude', 'reasoning', 'coding', 'general'], default: 'general' },
  difficulty:{ type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
});

const examSchema = new mongoose.Schema({
  job:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:     { type: String, required: true },
  duration:  { type: Number, default: 30 },   // minutes
  passMark:  { type: Number, default: 60 },   // percentage
  questions: [questionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);