import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Extract userId with fallback
    const userId = payload.userId || payload.sub || payload.id || payload._id;
    
    if (!userId) {
      console.error('Token missing userId field:', payload);
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    // Extract role with warning if missing
    const role = payload.role;
    if (!role) {
      console.warn('Token missing role field for user:', userId);
    }
    
    req.user = {
      id: userId,
      email: payload.email,
      name: payload.name,
      role: role || 'Student',
    };
    
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Alias for use in new Skill Gap Intelligence routes
export const verifyToken = requireAuth;
