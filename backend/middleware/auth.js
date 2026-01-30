import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('No authorization token provided');
    return res.status(401).json({ error: 'Access token required', code: 'NO_TOKEN' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.warn('Token verification failed:', err.message);
      return res.status(403).json({ 
        error: 'Invalid or expired token', 
        code: 'INVALID_TOKEN',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    if (!user || !user.id) {
      console.warn('Token missing user ID');
      return res.status(403).json({ error: 'Invalid token payload', code: 'INVALID_PAYLOAD' });
    }
    
    req.user = user;
    next();
  });
};
