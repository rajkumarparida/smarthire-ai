// const Exam        = require('../models/Exam');
// const Application = require('../models/Application');

// // ── Question Bank (used for auto-generation) ──────────────────────
// const questionBank = {
//   javascript: [
//     { question: 'Which keyword declares a block-scoped variable in JavaScript?',
//       options: ['var','let','def','dim'], answer: 1 },
//     { question: 'Which method adds an element to the end of an array?',
//       options: ['push()','pop()','shift()','splice()'], answer: 0 },
//     { question: 'What does "===" check in JavaScript?',
//       options: ['Value only','Type only','Value and type','Neither'], answer: 2 },
//     { question: 'Which of these is NOT a JavaScript framework?',
//       options: ['React','Angular','Django','Vue'], answer: 2 },
//     { question: 'What does JSON stand for?',
//       options: ['Java Serialized Object Notation','JavaScript Object Notation',
//                 'JavaScript Oriented Naming','Java Standard Output Notation'], answer: 1 },
//   ],
//   python: [
//     { question: 'Which of these is used to define a function in Python?',
//       options: ['function','def','func','define'], answer: 1 },
//     { question: 'What data type is the result of: type([])?',
//       options: ['tuple','dict','list','set'], answer: 2 },
//     { question: 'Which keyword is used for exception handling in Python?',
//       options: ['catch','rescue','except','handle'], answer: 2 },
//     { question: 'What does len() do in Python?',
//       options: ['Returns last element','Returns length','Deletes an item','Sorts a list'], answer: 1 },
//     { question: 'Which of these is a Python web framework?',
//       options: ['Laravel','Spring','Django','Rails'], answer: 2 },
//   ],
//   react: [
//     { question: 'Which hook is used for state in React?',
//       options: ['useEffect','useRef','useState','useContext'], answer: 2 },
//     { question: 'What does JSX stand for?',
//       options: ['JavaScript XML','Java Syntax Extension','JSON XML','JavaScript Extension'], answer: 0 },
//     { question: 'Which method re-renders a React component?',
//       options: ['setState()','updateState()','refreshState()','newState()'], answer: 0 },
//     { question: 'What is the virtual DOM in React?',
//       options: ['A browser API','A lightweight copy of real DOM',
//                 'A CSS framework','A database'], answer: 1 },
//     { question: 'Which hook runs after every render?',
//       options: ['useState','useCallback','useEffect','useMemo'], answer: 2 },
//   ],
//   mongodb: [
//     { question: 'MongoDB stores data in which format?',
//       options: ['Tables','XML','BSON/JSON documents','CSV'], answer: 2 },
//     { question: 'Which command finds all documents in a collection?',
//       options: ['db.col.getAll()','db.col.find({})','db.col.select()','db.col.fetch()'], answer: 1 },
//     { question: 'What is a MongoDB collection equivalent to in SQL?',
//       options: ['Row','Column','Table','Database'], answer: 2 },
//     { question: 'Which of these is a valid MongoDB data type?',
//       options: ['ObjectId','AutoInt','UUID','Serial'], answer: 0 },
//     { question: 'What does the $set operator do in MongoDB?',
//       options: ['Deletes a field','Creates a new collection',
//                 'Updates a specific field','Returns a set of documents'], answer: 2 },
//   ],
//   general: [
//     { question: 'What does API stand for?',
//       options: ['Application Programming Interface','Applied Program Integration',
//                 'Automated Process Interface','Application Process Integration'], answer: 0 },
//     { question: 'Which HTTP method is used to update a resource?',
//       options: ['GET','POST','PUT','DELETE'], answer: 2 },
//     { question: 'What does CSS stand for?',
//       options: ['Cascading Style Sheets','Computer Style Syntax',
//                 'Creative Style Sheets','Coded Style Syntax'], answer: 0 },
//     { question: 'Which status code means "Not Found"?',
//       options: ['200','301','403','404'], answer: 3 },
//     { question: 'What is the purpose of Git?',
//       options: ['Database management','Version control',
//                 'Server hosting','UI design'], answer: 1 },
//   ],
// };

// // Pick N random questions from an array
// const pickRandom = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

// // ── Auto-generate exam from job skills ────────────────────────────
// exports.generateExam = async (req, res) => {
//   try {
//     const { jobId } = req.params;
//     const job = await require('../models/Job').findById(jobId);
//     if (!job) return res.status(404).json({ message: 'Job not found' });

//     // Match job skills to question bank categories
//     const jobSkills  = job.requiredSkills.map(s => s.toLowerCase());
//     let questions    = [];

//     for (const [category, qs] of Object.entries(questionBank)) {
//       if (jobSkills.some(skill => skill.includes(category) || category.includes(skill))) {
//         questions.push(...pickRandom(qs, 2)); // 2 questions per matched skill
//       }
//     }

//     // Always add 3 general questions
//     questions.push(...pickRandom(questionBank.general, 3));

//     // Cap at 10 questions max, shuffle
//     questions = pickRandom(questions, Math.min(questions.length, 10));

//     // Save exam
//     const exam = await Exam.create({
//       job:       jobId,
//       createdBy: req.user.id,
//       title:     `${job.title} — Technical Exam`,
//       questions,
//     });

//     res.status(201).json({ message: 'Exam generated', examId: exam._id, title: exam.title });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ── Get exam for candidate (hide correct answers) ─────────────────
// exports.getExam = async (req, res) => {
//   try {
//     const exam = await Exam.findOne({ job: req.params.jobId });
//     if (!exam) return res.status(404).json({ message: 'No exam found for this job' });

//     // Strip correct answers before sending to candidate
//     const safeExam = {
//       _id:       exam._id,
//       title:     exam.title,
//       duration:  exam.duration,
//       passMark:  exam.passMark,
//       questions: exam.questions.map((q, i) => ({
//         index:    i,
//         question: q.question,
//         options:  q.options,
//       })),
//     };

//     res.json(safeExam);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ── Submit exam + auto score ──────────────────────────────────────
// exports.submitExam = async (req, res) => {
//   try {
//     const { jobId }  = req.params;
//     const { answers } = req.body; // { 0: 2, 1: 1, 2: 3, ... } index → chosen option

//     const exam = await Exam.findOne({ job: jobId });
//     if (!exam) return res.status(404).json({ message: 'Exam not found' });

//     const application = await Application.findOne({ job: jobId, candidate: req.user.id });
//     if (!application) return res.status(404).json({ message: 'Application not found' });

//     // ── Auto Scoring ──────────────────────────────────────────────
//     let correct = 0;
//     const result = exam.questions.map((q, i) => {
//       const chosen    = parseInt(answers[i] ?? -1);
//       const isCorrect = chosen === q.answer;
//       if (isCorrect) correct++;
//       return {
//         question:      q.question,
//         yourAnswer:    q.options[chosen] ?? 'Not answered',
//         correctAnswer: q.options[q.answer],
//         isCorrect,
//       };
//     });

//     const total      = exam.questions.length;
//     const score      = Math.round((correct / total) * 100);
//     const passed     = score >= exam.passMark;

//     // ── Update application stage ──────────────────────────────────
//     application.examScore  = score;
//     application.examPassed = passed;
//     application.stage      = passed ? 'interview' : 'rejected';
//     await application.save();

//     res.json({
//       score,
//       correct,
//       total,
//       passed,
//       passMark:  exam.passMark,
//       stage:     application.stage,
//       result,    // detailed per-question breakdown
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


const Exam        = require('../models/Exam');
const Application = require('../models/Application');

// ─────────────────────────────────────────────
//  EXPANDED QUESTION BANK
//  Three new categories added: aptitude, reasoning, coding
// ─────────────────────────────────────────────
const questionBank = {

  // ── Existing tech categories ──────────────────────────────────────
  javascript: [
    { question: 'Which keyword declares a block-scoped variable?',
      options: ['var','let','def','dim'], answer: 1, category:'coding' },
    { question: 'Which method adds an element to the end of an array?',
      options: ['push()','pop()','shift()','splice()'], answer: 0, category:'coding' },
    { question: 'What does "===" check in JavaScript?',
      options: ['Value only','Type only','Value and type','Neither'], answer: 2, category:'coding' },
    { question: 'Which of these is NOT a JavaScript framework?',
      options: ['React','Angular','Django','Vue'], answer: 2, category:'coding' },
    { question: 'What does JSON stand for?',
      options: ['Java Serialized Object Notation','JavaScript Object Notation','JavaScript Oriented Naming','Java Standard Output Notation'], answer: 1, category:'coding' },
  ],
  python: [
    { question: 'Which keyword defines a function in Python?',
      options: ['function','def','func','define'], answer: 1, category:'coding' },
    { question: 'What data type is the result of: type([])?',
      options: ['tuple','dict','list','set'], answer: 2, category:'coding' },
    { question: 'Which keyword is used for exception handling in Python?',
      options: ['catch','rescue','except','handle'], answer: 2, category:'coding' },
    { question: 'What does len() do in Python?',
      options: ['Returns last element','Returns length','Deletes an item','Sorts a list'], answer: 1, category:'coding' },
    { question: 'Which of these is a Python web framework?',
      options: ['Laravel','Spring','Django','Rails'], answer: 2, category:'coding' },
  ],
  react: [
    { question: 'Which hook is used for state in React?',
      options: ['useEffect','useRef','useState','useContext'], answer: 2, category:'coding' },
    { question: 'What does JSX stand for?',
      options: ['JavaScript XML','Java Syntax Extension','JSON XML','JavaScript Extension'], answer: 0, category:'coding' },
    { question: 'Which method re-renders a React component?',
      options: ['setState()','updateState()','refreshState()','newState()'], answer: 0, category:'coding' },
    { question: 'What is the virtual DOM in React?',
      options: ['A browser API','A lightweight copy of the real DOM','A CSS framework','A database'], answer: 1, category:'coding' },
    { question: 'Which hook runs after every render?',
      options: ['useState','useCallback','useEffect','useMemo'], answer: 2, category:'coding' },
  ],
  mongodb: [
    { question: 'MongoDB stores data in which format?',
      options: ['Tables','XML','BSON/JSON documents','CSV'], answer: 2, category:'coding' },
    { question: 'Which command finds all documents in a collection?',
      options: ['db.col.getAll()','db.col.find({})','db.col.select()','db.col.fetch()'], answer: 1, category:'coding' },
    { question: 'What is a MongoDB collection equivalent to in SQL?',
      options: ['Row','Column','Table','Database'], answer: 2, category:'coding' },
    { question: 'Which of these is a valid MongoDB data type?',
      options: ['ObjectId','AutoInt','UUID','Serial'], answer: 0, category:'coding' },
    { question: 'What does $set do in MongoDB?',
      options: ['Deletes a field','Creates a new collection','Updates a specific field','Returns a set'], answer: 2, category:'coding' },
  ],

  // ── NEW: Aptitude ────────────────────────────────────────────────
  aptitude: [
    { question: 'If a train travels 60 km in 1 hour, how far will it travel in 2.5 hours?',
      options: ['100 km','120 km','150 km','180 km'], answer: 2, category:'aptitude' },
    { question: 'What is 15% of 200?',
      options: ['20','25','30','35'], answer: 2, category:'aptitude' },
    { question: 'A pipe fills a tank in 4 hours. How much of the tank is filled in 90 minutes?',
      options: ['1/4','3/8','1/2','2/3'], answer: 1, category:'aptitude' },
    { question: 'If 6 workers finish a job in 8 days, how many days will 4 workers take?',
      options: ['10','12','14','16'], answer: 1, category:'aptitude' },
    { question: 'A car costs ₹5,00,000. After 20% depreciation, its value is:',
      options: ['₹3,50,000','₹4,00,000','₹4,20,000','₹4,50,000'], answer: 1, category:'aptitude' },
    { question: 'If 3x + 7 = 22, what is x?',
      options: ['3','4','5','6'], answer: 2, category:'aptitude' },
    { question: 'What is the next number in the series: 2, 6, 12, 20, __?',
      options: ['28','30','32','36'], answer: 1, category:'aptitude' },
    { question: 'A shopkeeper sells an item for ₹240 with 20% profit. What is the cost price?',
      options: ['₹180','₹192','₹200','₹210'], answer: 2, category:'aptitude' },
    { question: 'Simple interest on ₹1000 at 5% per annum for 3 years is:',
      options: ['₹100','₹125','₹150','₹175'], answer: 2, category:'aptitude' },
    { question: 'Average of 5, 10, 15, 20, 25 is:',
      options: ['12','13','14','15'], answer: 3, category:'aptitude' },
  ],

  // ── NEW: Reasoning ──────────────────────────────────────────────
  reasoning: [
    { question: 'If all roses are flowers and all flowers need water, do roses need water?',
      options: ['Yes','No','Cannot be determined','Only some roses'], answer: 0, category:'reasoning' },
    { question: 'BANK : MONEY :: LIBRARY : ?',
      options: ['Readers','Books','Knowledge','Staff'], answer: 1, category:'reasoning' },
    { question: 'Find the odd one out: Apple, Mango, Carrot, Banana',
      options: ['Apple','Mango','Carrot','Banana'], answer: 2, category:'reasoning' },
    { question: 'If Monday is 2 days after Saturday, what day comes 3 days after Wednesday?',
      options: ['Friday','Saturday','Sunday','Monday'], answer: 1, category:'reasoning' },
    { question: 'Arrange in logical order: (1) Egg (2) Hen (3) Chick (4) Rooster',
      options: ['4,2,1,3','2,1,3,4','1,3,4,2','4,1,2,3'], answer: 0, category:'reasoning' },
    { question: 'If A = 1, B = 2, ... Z = 26, what is CAB?',
      options: ['6','7','8','9'], answer: 0, category:'reasoning' },
    { question: 'Mirror image: If "TEAM" is reflected, it looks like:',
      options: ['MAET','MAET (flipped)','TAEM','MEAT'], answer: 0, category:'reasoning' },
    { question: 'Statement: All cats are animals. Some animals are wild. Conclusion: Some cats are wild.',
      options: ['Definitely true','Definitely false','Possibly true','Cannot determine'], answer: 2, category:'reasoning' },
    { question: 'Complete the series: Z, X, V, T, __',
      options: ['R','S','Q','P'], answer: 0, category:'reasoning' },
    { question: 'If CODING = FRGLQJ (shift +3), what is JAVA?',
      options: ['MDYD','MDZD','MCYC','MDYC'], answer: 0, category:'reasoning' },
  ],

  // ── NEW: Coding (language-agnostic / DS&A) ─────────────────────
  coding: [
    { question: 'What is the time complexity of binary search?',
      options: ['O(n)','O(log n)','O(n²)','O(1)'], answer: 1, category:'coding' },
    { question: 'Which data structure uses LIFO (Last In First Out)?',
      options: ['Queue','Stack','Linked List','Tree'], answer: 1, category:'coding' },
    { question: 'What is the output of: console.log(typeof null) in JavaScript?',
      options: ['"null"','"undefined"','"object"','"boolean"'], answer: 2, category:'coding' },
    { question: 'What does SQL SELECT DISTINCT do?',
      options: ['Returns all rows','Returns unique rows','Deletes duplicates','Sorts results'], answer: 1, category:'coding' },
    { question: 'In Git, which command stages all changes?',
      options: ['git commit -m','git push','git add .','git stash'], answer: 2, category:'coding' },
    { question: 'Which HTTP status code means "Unauthorized"?',
      options: ['400','401','403','404'], answer: 1, category:'coding' },
    { question: 'What does REST stand for?',
      options: ['Remote Execution State Transfer','Representational State Transfer','Relational State Technology','Remote Entity State Transfer'], answer: 1, category:'coding' },
    { question: 'What is recursion?',
      options: ['A loop that runs n times','A function that calls itself','A sorting algorithm','A data structure'], answer: 1, category:'coding' },
    { question: 'Which sorting algorithm has worst-case O(n log n)?',
      options: ['Bubble Sort','Selection Sort','Merge Sort','Insertion Sort'], answer: 2, category:'coding' },
    { question: 'What does CSS "position: absolute" do?',
      options: ['Positions relative to parent','Removes from flow, relative to nearest positioned ancestor','Fixes to viewport','Positions relative to body only'], answer: 1, category:'coding' },
  ],

  // ── General (existing) ──────────────────────────────────────────
  general: [
    { question: 'What does API stand for?',
      options: ['Application Programming Interface','Applied Program Integration','Automated Process Interface','Application Process Integration'], answer: 0, category:'general' },
    { question: 'Which HTTP method is used to update a resource?',
      options: ['GET','POST','PUT','DELETE'], answer: 2, category:'general' },
    { question: 'What does CSS stand for?',
      options: ['Cascading Style Sheets','Computer Style Syntax','Creative Style Sheets','Coded Style Syntax'], answer: 0, category:'general' },
    { question: 'Which status code means "Not Found"?',
      options: ['200','301','403','404'], answer: 3, category:'general' },
    { question: 'What is the purpose of Git?',
      options: ['Database management','Version control','Server hosting','UI design'], answer: 1, category:'general' },
  ],
};

// Helper: pick N random from array
const pickRandom = (arr, n) =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, n);

// ─────────────────────────────────────────────
//  GENERATE EXAM  (Recruiter)
//  - Always includes: 4 aptitude + 3 reasoning + 3 coding/tech
//  - Skill-matched tech questions replace generic coding pool
// ─────────────────────────────────────────────
exports.generateExam = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await require('../models/Job').findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // 1. Skill-matched tech questions (up to 3)
    const jobSkills = job.requiredSkills.map(s => s.toLowerCase());
    let techPool = [];
    for (const [cat, qs] of Object.entries(questionBank)) {
      if (['aptitude','reasoning','coding','general'].includes(cat)) continue;
      if (jobSkills.some(s => s.includes(cat) || cat.includes(s))) {
        techPool.push(...pickRandom(qs, 2));
      }
    }
    // Fallback to generic coding questions if no skill match
    if (techPool.length < 3) {
      techPool.push(...pickRandom(questionBank.coding, 3 - techPool.length));
    }
    const techQuestions = pickRandom(techPool, 3);

    // 2. Fixed aptitude (4) + reasoning (3)
    const aptitudeQuestions = pickRandom(questionBank.aptitude, 4);
    const reasoningQuestions = pickRandom(questionBank.reasoning, 3);

    // 3. Combine → exactly 10 questions, shuffled
    const questions = pickRandom(
      [...aptitudeQuestions, ...reasoningQuestions, ...techQuestions],
      10
    );

    const exam = await Exam.create({
      job:       jobId,
      createdBy: req.user.id,
      title:     `${job.title} — Round 1 Assessment`,
      duration:  30,
      passMark:  60,
      questions,
    });

    res.status(201).json({
      message: 'Exam generated',
      examId:  exam._id,
      title:   exam.title,
      breakdown: {
        aptitude:  aptitudeQuestions.length,
        reasoning: reasoningQuestions.length,
        coding:    techQuestions.length,
        total:     questions.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
//  GET EXAM  (Candidate — answers hidden)
// ─────────────────────────────────────────────
exports.getExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({ job: req.params.jobId });
    if (!exam) return res.status(404).json({ message: 'No exam found for this job' });

    const safeExam = {
      _id:      exam._id,
      title:    exam.title,
      duration: exam.duration,
      passMark: exam.passMark,
      questions: exam.questions.map((q, i) => ({
        index:    i,
        question: q.question,
        options:  q.options,
        category: q.category,     // frontend can show category badge
      })),
    };
    res.json(safeExam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
//  SUBMIT EXAM  (Candidate)
//  Supports both manual submit and auto-submit on timeout
//  Body: { answers: { "0": 2, "1": 1, ... }, autoSubmitted: true|false }
// ─────────────────────────────────────────────
exports.submitExam = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { answers, autoSubmitted = false } = req.body;

    const exam = await Exam.findOne({ job: jobId });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const application = await Application.findOne({ job: jobId, candidate: req.user.id });
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Prevent re-submission
    if (application.examPassed !== null) {
      return res.status(400).json({ message: 'Exam already submitted' });
    }

    // Auto-score
    let correct = 0;
    const result = exam.questions.map((q, i) => {
      const chosen    = parseInt(answers[i] ?? -1);
      const isCorrect = chosen === q.answer;
      if (isCorrect) correct++;
      return {
        question:      q.question,
        category:      q.category,
        yourAnswer:    chosen >= 0 ? q.options[chosen] : 'Not answered',
        correctAnswer: q.options[q.answer],
        isCorrect,
      };
    });

    const total  = exam.questions.length;
    const score  = Math.round((correct / total) * 100);
    const passed = score >= exam.passMark;

    // Breakdown by category
    const breakdown = result.reduce((acc, r) => {
      const cat = r.category || 'general';
      if (!acc[cat]) acc[cat] = { total: 0, correct: 0 };
      acc[cat].total++;
      if (r.isCorrect) acc[cat].correct++;
      return acc;
    }, {});

    // Update application
    application.examScore  = score;
    application.examPassed = passed;
    application.stage      = passed ? 'interview' : 'rejected';
    await application.save();

    res.json({
      score,
      correct,
      total,
      passed,
      passMark:      exam.passMark,
      autoSubmitted,
      stage:         application.stage,
      breakdown,
      result,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};