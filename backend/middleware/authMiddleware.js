const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

exports.recruiterOnly = (req, res, next) => {
  if (req.user.role !== 'recruiter')
    return res.status(403).json({ message: 'Access denied: Recruiters only' });
  next();
};

exports.candidateOnly = (req, res, next) => {
  if (req.user.role !== 'candidate')
    return res.status(403).json({ message: 'Access denied: Candidates only' });
  next();
};