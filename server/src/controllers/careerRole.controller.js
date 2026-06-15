import { asyncHandler } from '../utils/asyncHandler.js';
import CareerRole from '../models/CareerRole.js';
import { audit } from '../services/auditService.js';

export const getAll = asyncHandler(async (req, res) => {
  const roles = await CareerRole.find({ isActive: true })
    .select('title description industry requiredSkills createdAt')
    .sort({ createdAt: -1 });

  return res.json({ roles });
});

export const create = asyncHandler(async (req, res) => {
  const { title, description, industry, requiredSkills } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'title is required' });
  }

  const role = await CareerRole.create({
    title,
    description: description || '',
    industry: industry || '',
    requiredSkills: requiredSkills || [],
    createdBy: req.user.id,
  });

  await audit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'CAREER_ROLE_CREATED',
    targetId: role._id,
    targetModel: 'CareerRole',
    metadata: { title: role.title, industry: role.industry, skillCount: role.requiredSkills?.length || 0 },
    ip: req.ip || 'unknown'
  });

  return res.status(201).json({ role });
});

export const update = asyncHandler(async (req, res) => {
  const { title, description, industry, requiredSkills, isActive } = req.body;
  const updates = {};

  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (industry !== undefined) updates.industry = industry;
  if (requiredSkills !== undefined) updates.requiredSkills = requiredSkills;
  if (isActive !== undefined) updates.isActive = isActive;

  const role = await CareerRole.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!role) {
    return res.status(404).json({ message: 'Career role not found' });
  }

  await audit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'CAREER_ROLE_UPDATED',
    targetId: role._id,
    targetModel: 'CareerRole',
    metadata: { title: role.title },
    ip: req.ip || 'unknown'
  });

  return res.json({ role });
});

export const softDelete = asyncHandler(async (req, res) => {
  const role = await CareerRole.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!role) {
    return res.status(404).json({ message: 'Career role not found' });
  }

  await audit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'CAREER_ROLE_DELETED',
    targetId: req.params.id,
    targetModel: 'CareerRole',
    metadata: { title: role.title },
    ip: req.ip || 'unknown'
  });

  return res.json({ message: 'Career role deactivated', role });
});
