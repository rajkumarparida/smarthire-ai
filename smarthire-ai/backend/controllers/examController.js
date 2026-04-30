const Exam        = require('../models/Exam');
const Application = require('../models/Application');

// ── Question Bank (used for auto-generation) ──────────────────────
const questionBank = {
  javascript: [
    { question: 'Which keyword declares a block-scoped variable in JavaScript?',
      options: ['var','let','def','dim'], answer: 1 },
    { question: 'Which method adds an element to the end of an array?',
      options: ['push()','pop()','shift()','splice()'], answer: 0 },
    { question: 'What does "===" check in JavaScript?',
      options: ['Value only','Type only','Value and type','Neither'], answer: 2 },
    { question: 'Which of these is NOT a JavaScript framework?',
      options: ['React','Angular','Django','Vue'], answer: 2 },
    { question: 'What does JSON stand for?',
      options: ['Java Serialized Object Notation','JavaScript Object Notation',
                'JavaScript Oriented Naming','Java Standard Output Notation'], answer: 1 },
  ],
  python: [
    { question: 'Which of these is used to define a function in Python?',
      options: ['function','def','func','define'], answer: 1 },
    { question: 'What data type is the result of: type([])?',
      options: ['tuple','dict','list','set'], answer: 2 },
    { question: 'Which keyword is used for exception handling in Python?',
      options: ['catch','rescue','except','handle'], answer: 2 },
    { question: 'What does len() do in Python?',
      options: ['Returns last element','Returns length','Deletes an item','Sorts a list'], answer: 1 },
    { question: 'Which of these is a Python web framework?',
      options: ['Laravel','Spring','Django','Rails'], answer: 2 },
  ],
  react: [
    { question: 'Which hook is used for state in React?',
      options: ['useEffect','useRef','useState','useContext'], answer: 2 },
    { question: 'What does JSX stand for?',
      options: ['JavaScript XML','Java Syntax Extension','JSON XML','JavaScript Extension'], answer: 0 },
    { question: 'Which method re-renders a React component?',
      options: ['setState()','updateState()','refreshState()','newState()'], answer: 0 },
    { question: 'What is the virtual DOM in React?',
      options: ['A browser API','A lightweight copy of real DOM',
                'A CSS framework','A database'], answer: 1 },
    { question: 'Which hook runs after every render?',
      options: ['useState','useCallback','useEffect','useMemo'], answer: 2 },
  ],
  mongodb: [
    { question: 'MongoDB stores data in which format?',
      options: ['Tables','XML','BSON/JSON documents','CSV'], answer: 2 },
    { question: 'Which command finds all documents in a collection?',
      options: ['db.col.getAll()','db.col.find({})','db.col.select()','db.col.fetch()'], answer: 1 },
    { question: 'What is a MongoDB collection equivalent to in SQL?',
      options: ['Row','Column','Table','Database'], answer: 2 },
    { question: 'Which of these is a valid MongoDB data type?',
      options: ['ObjectId','AutoInt','UUID','Serial'], answer: 0 },
    { question: 'What does the $set operator do in MongoDB?',
      options: ['Deletes a field','Creates a new collection',
                'Updates a specific field','Returns a set of documents'], answer: 2 },
  ],
  general: [
    { question: 'What does API stand for?',
      options: ['Application Programming Interface','Applied Program Integration',
                'Automated Process Interface','Application Process Integration'], answer: 0 },
    { question: 'Which HTTP method is used to update a resource?',
      options: ['GET','POST','PUT','DELETE'], answer: 2 },
    { question: 'What does CSS stand for?',
      options: ['Cascading Style Sheets','Computer Style Syntax',
                'Creative Style Sheets','Coded Style Syntax'], answer: 0 },
    { question: 'Which status code means "Not Found"?',
      options: ['200','301','403','404'], answer: 3 },
    { question: 'What is the purpose of Git?',
      options: ['Database management','Version control',
                'Server hosting','UI design'], answer: 1 },
  ],
};

// Pick N random questions from an array
const pickRandom = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

// ── Auto-generate exam from job skills ────────────────────────────
exports.generateExam = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await require('../models/Job').findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Match job skills to question bank categories
    const jobSkills  = job.requiredSkills.map(s => s.toLowerCase());
    let questions    = [];

    for (const [category, qs] of Object.entries(questionBank)) {
      if (jobSkills.some(skill => skill.includes(category) || category.includes(skill))) {
        questions.push(...pickRandom(qs, 2)); // 2 questions per matched skill
      }
    }

    // Always add 3 general questions
    questions.push(...pickRandom(questionBank.general, 3));

    // Cap at 10 questions max, shuffle
    questions = pickRandom(questions, Math.min(questions.length, 10));

    // Save exam
    const exam = await Exam.create({
      job:       jobId,
      createdBy: req.user.id,
      title:     `${job.title} — Technical Exam`,
      questions,
    });

    res.status(201).json({ message: 'Exam generated', examId: exam._id, title: exam.title });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get exam for candidate (hide correct answers) ─────────────────
exports.getExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({ job: req.params.jobId });
    if (!exam) return res.status(404).json({ message: 'No exam found for this job' });

    // Strip correct answers before sending to candidate
    const safeExam = {
      _id:       exam._id,
      title:     exam.title,
      duration:  exam.duration,
      passMark:  exam.passMark,
      questions: exam.questions.map((q, i) => ({
        index:    i,
        question: q.question,
        options:  q.options,
      })),
    };

    res.json(safeExam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Submit exam + auto score ──────────────────────────────────────
exports.submitExam = async (req, res) => {
  try {
    const { jobId }  = req.params;
    const { answers } = req.body; // { 0: 2, 1: 1, 2: 3, ... } index → chosen option

    const exam = await Exam.findOne({ job: jobId });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const application = await Application.findOne({ job: jobId, candidate: req.user.id });
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // ── Auto Scoring ──────────────────────────────────────────────
    let correct = 0;
    const result = exam.questions.map((q, i) => {
      const chosen    = parseInt(answers[i] ?? -1);
      const isCorrect = chosen === q.answer;
      if (isCorrect) correct++;
      return {
        question:      q.question,
        yourAnswer:    q.options[chosen] ?? 'Not answered',
        correctAnswer: q.options[q.answer],
        isCorrect,
      };
    });

    const total      = exam.questions.length;
    const score      = Math.round((correct / total) * 100);
    const passed     = score >= exam.passMark;

    // ── Update application stage ──────────────────────────────────
    application.examScore  = score;
    application.examPassed = passed;
    application.stage      = passed ? 'interview' : 'rejected';
    await application.save();

    res.json({
      score,
      correct,
      total,
      passed,
      passMark:  exam.passMark,
      stage:     application.stage,
      result,    // detailed per-question breakdown
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};