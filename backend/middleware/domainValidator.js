// ── Blocked free email domains ────────────────────────────────────
const blockedDomains = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'live.com', 'icloud.com', 'aol.com', 'protonmail.com',
  'zoho.com', 'ymail.com', 'mail.com', 'gmx.com',
  'rediffmail.com', 'inbox.com', 'fastmail.com', 'tutanota.com',
];

exports.isCompanyEmail = (email, role) => {
  // Only restrict recruiters
  if (role !== 'recruiter') return { valid: true };

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { valid: false, message: 'Invalid email format' };

  if (blockedDomains.includes(domain)) {
    return {
      valid: false,
      message: `Recruiters must use a company email. Free email providers like ${domain} are not allowed.`,
    };
  }

  return { valid: true };
};