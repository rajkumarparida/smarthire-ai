/**
 * SmartHire AI — Resume Analyzer
 * Scoring is based on 4 weighted categories:
 *   Skills Match     → 50%
 *   Experience Level → 20%
 *   Education        → 15%
 *   Certifications   → 15%
 */

// ─── Keyword Dictionaries ───────────────────────────────────────────

const skillKeywords = {
  languages:  ['javascript','python','java','c++','c#','php','ruby','swift','kotlin','typescript','go','rust','scala','r'],
  frontend:   ['react','angular','vue','html','css','bootstrap','tailwind','redux','nextjs','jquery','sass'],
  backend:    ['node.js','express','django','flask','spring','laravel','fastapi','asp.net'],
  database:   ['mongodb','mysql','postgresql','redis','firebase','sqlite','oracle','cassandra'],
  devops:     ['git','docker','kubernetes','aws','azure','gcp','linux','ci/cd','jenkins','terraform'],
  ai_ml:      ['machine learning','deep learning','tensorflow','pytorch','nlp','opencv','scikit-learn','keras','pandas','numpy'],
  other:      ['rest api','graphql','agile','scrum','figma','jira','postman','microservices'],
};

const experienceKeywords = {
  senior: ['senior','lead','architect','principal','head of','manager','director','10+ years','8+ years','7+ years'],
  mid:    ['mid-level','intermediate','3+ years','4+ years','5+ years','6+ years'],
  junior: ['junior','associate','1+ year','2+ years','entry level','fresher','graduate','intern'],
};

const educationKeywords = {
  phd:      ['ph.d','phd','doctorate','doctor of'],
  masters:  ['m.tech','m.e','mca','msc','m.s','master of','masters'],
  bachelors:['b.tech','b.e','bca','bsc','b.s','bachelor of','bachelors','undergraduate'],
  diploma:  ['diploma','polytechnic'],
};

const certificationKeywords = [
  'aws certified','azure certified','google certified','gcp certified',
  'pmp','cissp','ceh','ccna','ccnp',
  'oracle certified','mongodb certified',
  'react certification','node certification',
  'tensorflow certificate','coursera','udemy','nptel',
];

// ─── Helpers ────────────────────────────────────────────────────────

const normalize = (text) => text.toLowerCase();

const findMatches = (text, keywords) =>
  keywords.filter(k => text.includes(normalize(k)));

const allSkills = Object.values(skillKeywords).flat();

// ─── Main Analyzer ──────────────────────────────────────────────────

exports.analyzeResume = (resumeText, jobRequiredSkills = []) => {
  const text = normalize(resumeText);

  // ── 1. Skills Match Score (50%) ──────────────────────────────────
  const extractedSkills   = findMatches(text, allSkills);
  const jobMatched        = jobRequiredSkills.length > 0
    ? findMatches(text, jobRequiredSkills)
    : extractedSkills;

  const skillScore = jobRequiredSkills.length > 0
    ? Math.round((jobMatched.length / jobRequiredSkills.length) * 100)
    : Math.min(extractedSkills.length * 8, 100); // fallback if no job skills

  // ── 2. Experience Score (20%) ────────────────────────────────────
  let experienceLevel = 'fresher';
  let experienceScore = 30; // default

  if (findMatches(text, experienceKeywords.senior).length > 0) {
    experienceLevel = 'senior'; experienceScore = 100;
  } else if (findMatches(text, experienceKeywords.mid).length > 0) {
    experienceLevel = 'mid';    experienceScore = 70;
  } else if (findMatches(text, experienceKeywords.junior).length > 0) {
    experienceLevel = 'junior'; experienceScore = 45;
  }

  // ── 3. Education Score (15%) ─────────────────────────────────────
  let educationLevel = 'not detected';
  let educationScore = 0;

  if (findMatches(text, educationKeywords.phd).length > 0) {
    educationLevel = 'PhD';       educationScore = 100;
  } else if (findMatches(text, educationKeywords.masters).length > 0) {
    educationLevel = 'Masters';   educationScore = 85;
  } else if (findMatches(text, educationKeywords.bachelors).length > 0) {
    educationLevel = 'Bachelors'; educationScore = 70;
  } else if (findMatches(text, educationKeywords.diploma).length > 0) {
    educationLevel = 'Diploma';   educationScore = 50;
  }

  // ── 4. Certification Score (15%) ─────────────────────────────────
  const foundCerts    = findMatches(text, certificationKeywords);
  const certScore     = Math.min(foundCerts.length * 25, 100);

  // ── Final Weighted Score ─────────────────────────────────────────
  const finalScore = Math.round(
    (skillScore      * 0.50) +
    (experienceScore * 0.20) +
    (educationScore  * 0.15) +
    (certScore       * 0.15)
  );

  // ── Recommendation ───────────────────────────────────────────────
  let recommendation = '';
  if      (finalScore >= 80) recommendation = 'Strongly Recommended';
  else if (finalScore >= 60) recommendation = 'Recommended';
  else if (finalScore >= 40) recommendation = 'Maybe';
  else                       recommendation = 'Not Recommended';

  // ── Skill Breakdown by Category ──────────────────────────────────
  const skillBreakdown = {};
  for (const [category, keywords] of Object.entries(skillKeywords)) {
    const found = findMatches(text, keywords);
    if (found.length > 0) skillBreakdown[category] = found;
  }

  return {
    finalScore,
    recommendation,
    breakdown: {
      skillScore,
      experienceScore,
      educationScore,
      certScore,
    },
    details: {
      extractedSkills,
      matchedJobSkills:   jobMatched,
      missingSkills:      jobRequiredSkills.filter(s => !jobMatched.includes(s.toLowerCase())),
      experienceLevel,
      educationLevel,
      certifications:     foundCerts,
      skillBreakdown,
    }
  };
};