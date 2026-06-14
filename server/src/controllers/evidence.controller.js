import { asyncHandler } from '../utils/asyncHandler.js';
import SkillEvidence from '../models/SkillEvidence.js';
import StudentProfile from '../models/StudentProfile.js';
import AuditEvent from '../models/AuditEvent.js';
import { createNotification } from '../services/notificationService.js';

export const submit = asyncHandler(async (req, res) => {
  const { skillId, type, externalLink } = req.body;

  if (!skillId || !type) {
    return res.status(400).json({ message: 'skillId and type are required' });
  }

  const validTypes = ['file', 'url'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: `type must be one of: ${validTypes.join(', ')}` });
  }

  if (type === 'url' && !externalLink) {
    return res.status(400).json({ message: 'externalLink is required when type is "url"' });
  }

  // Check if student has a mentor assigned
  const profile = await StudentProfile.findOne({ userId: req.user.id });
  const mentorId = profile?.mentorId || null;

  const evidence = await SkillEvidence.create({
    studentId: req.user.id,
    skillId,
    type,
    fileUrl: req.file ? req.file.path : '',
    externalLink: externalLink || '',
    status: 'pending',
    mentorId,
  });

  return res.status(201).json({ evidence });
});

export const getMy = asyncHandler(async (req, res) => {
  const evidence = await SkillEvidence.find({ studentId: req.user.id })
    .populate('skillId', 'skillName category')
    .populate('mentorId', 'name email')
    .sort({ submittedAt: -1 });

  return res.json({ evidence });
});

export const getPending = asyncHandler(async (req, res) => {
  // Mentor sees all pending evidence assigned to them
  const evidence = await SkillEvidence.find({
    mentorId: req.user.id,
    status: 'pending',
  })
    .populate('studentId', 'name email')
    .populate('skillId', 'skillName category')
    .sort({ submittedAt: -1 });

  return res.json({ evidence });
});

export const review = asyncHandler(async (req, res) => {
  const { status, mentorNote } = req.body;

  const validStatuses = ['approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
  }

  const evidence = await SkillEvidence.findById(req.params.id);
  if (!evidence) {
    return res.status(404).json({ message: 'Evidence not found' });
  }

  // Verify this mentor is assigned to review
  if (evidence.mentorId && evidence.mentorId.toString() !== req.user.id) {
    return res.status(403).json({ message: 'You are not assigned to review this evidence' });
  }

  evidence.status = status;
  evidence.mentorNote = mentorNote || '';
  evidence.mentorId = req.user.id;
  evidence.reviewedAt = new Date();
  await evidence.save();

  // Send notification to student
  await createNotification({
    recipientId: evidence.studentId,
    type: status === 'approved' ? 'EVIDENCE_APPROVED' : 'EVIDENCE_REJECTED',
    title: status === 'approved' ? 'Evidence Approved' : 'Evidence Rejected',
    message: status === 'approved'
      ? `Your evidence for a skill has been approved by your mentor.`
      : `Your evidence was rejected. Mentor note: ${mentorNote || 'No note provided.'}`,
    link: '/student/skills'
  });

  // Log audit event
  await AuditEvent.create({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'EVIDENCE_REVIEWED',
    targetId: evidence._id.toString(),
    targetModel: 'SkillEvidence',
    metadata: { status, mentorNote: mentorNote || '' },
    ip: req.ip || req.connection?.remoteAddress || 'unknown',
  });

  return res.json({ evidence });
});

export const getReviewed = asyncHandler(async (req, res) => {
  const evidence = await SkillEvidence.find({
    mentorId: req.user.id,
    status: { $in: ['approved', 'rejected'] }
  })
    .populate('studentId', 'name email')
    .populate('skillId', 'skillName category')
    .sort({ reviewedAt: -1 });
  
  return res.json({ evidence });
});
