import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const requireAuth = async (req, res, next) => {
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
    
    // Session revocation: check isActive on every protected request
    const dbUser = await User.findById(userId).select('isActive').lean();
    if (!dbUser) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    if (!dbUser.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact an administrator.' });
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
