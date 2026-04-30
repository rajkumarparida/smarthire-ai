/**
 * Simple AI Skill Matcher
 * Compares candidate resume text against job required skills
 * Returns a match score from 0 to 100
 */

exports.matchSkills = (resumeText, requiredSkills) => {
  if (!resumeText || !requiredSkills || requiredSkills.length === 0) return 0;

  const resumeLower = resumeText.toLowerCase();

  const matched = requiredSkills.filter(skill =>
    resumeLower.includes(skill.toLowerCase())
  );

  const score = Math.round((matched.length / requiredSkills.length) * 100);

  return { score, matchedSkills: matched, totalRequired: requiredSkills.length };
};

/**
 * Extract skills from resume text
 * Checks against a common skills dictionary
 */
exports.extractSkills = (resumeText) => {
  const skillsDictionary = [
    // Programming languages
    'javascript','python','java','c++','c#','php','ruby','swift','kotlin','typescript',
    // Frontend
    'react','angular','vue','html','css','bootstrap','tailwind','redux','nextjs',
    // Backend
    'node.js','express','django','flask','spring','laravel',
    // Database
    'mongodb','mysql','postgresql','redis','firebase','sqlite',
    // Tools & Cloud
    'git','docker','kubernetes','aws','azure','gcp','linux',
    // AI/ML
    'machine learning','deep learning','tensorflow','pytorch','nlp','opencv',
    // Other
    'rest api','graphql','agile','scrum','figma',
  ];

  const resumeLower = resumeText.toLowerCase();
  return skillsDictionary.filter(skill => resumeLower.includes(skill));
};