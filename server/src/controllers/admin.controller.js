import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/User.js';
import AuditEvent from '../models/AuditEvent.js';

export const getUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (role) {
    filter.role = role;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter),
  ]);

  return res.json({
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

export const changeRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ['Student', 'Mentor', 'PlacementOfficer', 'Admin'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select('-passwordHash');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Log audit event
  await AuditEvent.create({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'ROLE_CHANGED',
    targetId: user._id.toString(),
    targetModel: 'User',
    metadata: { newRole: role },
    ip: req.ip || req.connection?.remoteAddress || 'unknown',
  });

  return res.json({ user });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'isActive must be a boolean' });
  }

  // Prevent admin from deactivating themselves
  if (req.params.id === req.user.id && !isActive) {
    return res.status(400).json({ message: 'Cannot deactivate your own account' });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true, runValidators: true }
  ).select('-passwordHash');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Log audit event
  await AuditEvent.create({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    targetId: user._id.toString(),
    targetModel: 'User',
    metadata: { isActive },
    ip: req.ip || req.connection?.remoteAddress || 'unknown',
  });

  return res.json({ user });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { actorRole, action, page = 1, limit = 50 } = req.query;
  const filter = {};

  if (actorRole) filter.actorRole = actorRole;
  if (action) filter.action = action;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditEvent.find(filter)
      .populate('actorId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AuditEvent.countDocuments(filter),
  ]);

  return res.json({
    logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});
export const getDashboardStats = asyncHandler(async (req, res) => {
  const Exchange = (await import('../models/Exchange.js')).default
  const CareerRole = (await import('../models/CareerRole.js')).default
  const GapReport = (await import('../models/GapReport.js')).default
  const Roadmap = (await import('../models/Roadmap.js')).default

  const [
    totalUsers,
    totalStudents,
    totalMentors,
    totalOfficers,
    activeExchanges,
    totalCareerRoles,
    totalGapReports,
    totalRoadmaps,
    recentLogs
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'Student', isActive: true }),
    User.countDocuments({ role: 'Mentor', isActive: true }),
    User.countDocuments({ role: 'PlacementOfficer', isActive: true }),
    Exchange.countDocuments({ status: 'active' }),
    CareerRole.countDocuments({ isActive: true }),
    GapReport.countDocuments(),
    Roadmap.countDocuments({ overallStatus: 'active' }),
    AuditEvent.find().sort({ timestamp: -1 }).limit(5).populate('actorId', 'name email').lean()
  ])

  res.json({
    totalUsers,
    totalStudents,
    totalMentors,
    totalOfficers,
    activeExchanges,
    totalCareerRoles,
    totalGapReports,
    totalRoadmaps,
    recentLogs
  })
})