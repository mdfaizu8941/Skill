import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isValidEmail = (email) => emailPattern.test(email);

const createToken = (user) =>
  jwt.sign(
    {
      email: user.email,
      name: user.name,
      role: user.role || 'Student',
      userId: user._id.toString(),
    },
    process.env.JWT_SECRET,
    {
      subject: user._id.toString(),
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );

const publicUser = (user) => ({
  _id: user._id.toString(),
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  profilePic: user.profilePic,
  bio: user.bio,
  institution: user.institution,
  role: user.role || 'Student',
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password, institution = '', role = 'Student' } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Self-registration is restricted to Student and Mentor only
    const allowedSelfRoles = ['Student', 'Mentor'];
    const assignedRole = allowedSelfRoles.includes(role) ? role : 'Student';

    // Reject if user tries to register as PlacementOfficer or Admin
    if (role && !allowedSelfRoles.includes(role)) {
      return res.status(403).json({ 
        message: 'Self-registration is only available for Student and Mentor roles. Contact an administrator for other roles.' 
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      institution,
      role: assignedRole,
    });

    const token = createToken(user);
    return res.status(201).json({ 
      token, 
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
};

// Admin-only: create a user with any role (PlacementOfficer, Admin, etc.)
export const adminCreateUser = async (req, res, next) => {
  try {
    const { name, email, password, institution = '', role = 'Student' } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const validRoles = ['Student', 'Mentor', 'PlacementOfficer', 'Admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      institution,
      role,
    });

    const token = createToken(user);
    return res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact an administrator.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    const token = createToken(user);
    return res.json({ token, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { name, institution, bio, profilePic } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (institution !== undefined) updates.institution = institution;
    if (bio !== undefined) updates.bio = bio;
    if (profilePic !== undefined) updates.profilePic = profilePic;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};
