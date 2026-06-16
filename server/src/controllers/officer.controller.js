import mongoose from 'mongoose';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Skill from '../models/Skill.js';
import SkillEvidence from '../models/SkillEvidence.js';
import Rating from '../models/Rating.js';
import AuditEvent from '../models/AuditEvent.js';
import Opportunity from '../models/Opportunity.js';
import EligibilityCriteria from '../models/EligibilityCriteria.js';
import Announcement from '../models/Announcement.js';
import { createNotification } from '../services/notificationService.js';

import { asyncHandler } from '../utils/asyncHandler.js';

const opportunityCategories = ['Internship', 'Placement', 'Hackathon', 'Scholarship', 'Workshop', 'Competition'];
const opportunityStatuses = ['draft', 'active', 'closed', 'archived'];
const applicationStatuses = ['applied', 'shortlisted', 'rejected', 'selected', 'withdrawn'];
const placementStatuses = ['not_started', 'preparing', 'eligible', 'applied', 'interviewing', 'placed', 'not_interested'];

const toId = (value) => {
  if (!value) return '';
  if (value._id) return value._id.toString();
  return value.toString();
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseList = (value) => {
  if (value === undefined || value === null || value === '') return [];
  const values = Array.isArray(value) ? value : String(value).split(',');
  return values
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseNumberList = (value) => parseList(value)
  .map((item) => Number(item))
  .filter((item) => Number.isFinite(item));

const lowerList = (values) => parseList(values).map((item) => item.toLowerCase());

const splitLines = (value) => parseList(value).flatMap((item) => item.split('\n')).map((item) => item.trim()).filter(Boolean);

const cleanEligibility = (payload = {}) => ({
  minCgpa: Math.max(0, Math.min(10, Number(payload.minCgpa || 0))),
  requiredSkills: parseList(payload.requiredSkills),
  branches: parseList(payload.branches),
  years: parseNumberList(payload.years),
  certifications: parseList(payload.certifications),
  placementStatuses: parseList(payload.placementStatuses || payload.placementStatus),
  mentorAssigned: ['assigned', 'unassigned'].includes(payload.mentorAssigned) ? payload.mentorAssigned : 'any',
});

const serializeCriteria = (criteria = {}) => ({
  minCgpa: Number(criteria.minCgpa || 0),
  requiredSkills: parseList(criteria.requiredSkills),
  branches: parseList(criteria.branches),
  years: parseNumberList(criteria.years),
  certifications: parseList(criteria.certifications),
  placementStatuses: parseList(criteria.placementStatuses || criteria.placementStatus),
  mentorAssigned: ['assigned', 'unassigned'].includes(criteria.mentorAssigned) ? criteria.mentorAssigned : 'any',
});

const logOfficerAction = async (req, action, targetId = null, targetModel = null, metadata = {}) => {
  try {
    await AuditEvent.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action,
      targetId: targetId ? targetId.toString() : null,
      targetModel,
      metadata,
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
    });
  } catch (error) {
    console.error('Officer audit log failed:', error.message);
  }
};

const getStudentDirectory = async () => {
  const users = await User.find({ role: 'Student', isActive: true })
    .select('name email institution profilePic avatarUrl bio createdAt isActive')
    .sort({ name: 1 })
    .lean();
  const userIds = users.map((user) => user._id);

  const [profiles, skills, evidenceCounts, latestGapReports] = await Promise.all([
    StudentProfile.find({ userId: { $in: userIds } })
      .populate('mentorId', 'name email')
      .lean(),
    Skill.find({ user: { $in: userIds } })
      .select('user skillName category level')
      .sort({ createdAt: -1 })
      .lean(),
    SkillEvidence.aggregate([
      { $match: { studentId: { $in: userIds } } },
      { $group: { _id: { studentId: '$studentId', status: '$status' }, count: { $sum: 1 } } },
    ]),
    (await import('../models/GapReport.js')).default
      .find({ studentId: { $in: userIds } })
      .sort({ generatedAt: -1 })
      .lean(),
  ]);

  const profilesByUser = new Map(profiles.map((profile) => [toId(profile.userId), profile]));
  const skillsByUser = skills.reduce((map, skill) => {
    const key = toId(skill.user);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({
      _id: skill._id,
      skillName: skill.skillName,
      category: skill.category,
      level: skill.level,
    });
    return map;
  }, new Map());
  const evidenceByUser = evidenceCounts.reduce((map, item) => {
    const key = toId(item._id.studentId);
    if (!map.has(key)) map.set(key, {});
    map.get(key)[item._id.status] = item.count;
    return map;
  }, new Map());
  const latestReportByUser = new Map();
  latestGapReports.forEach((report) => {
    const key = toId(report.studentId);
    if (!latestReportByUser.has(key)) latestReportByUser.set(key, report);
  });

  return users.map((user) => {
    const id = toId(user._id);
    const profile = profilesByUser.get(id) || {};
    const userSkills = skillsByUser.get(id) || [];
    const evidence = evidenceByUser.get(id) || {};
    const latestGapReport = latestReportByUser.get(id) || null;

    return {
      _id: id,
      id,
      name: user.name,
      email: user.email,
      institution: user.institution,
      profilePic: user.profilePic,
      avatarUrl: profile.avatarUrl || user.avatarUrl,
      bio: user.bio,
      branch: profile.branch || '',
      year: profile.year || '',
      cgpa: Number(profile.cgpa || 0),
      certifications: profile.certifications || [],
      placementStatus: profile.placementStatus || 'not_started',
      resumeUrl: profile.resumeUrl || '',
      portfolioUrl: profile.portfolioUrl || '',
      mentor: profile.mentorId || null,
      mentorAssigned: Boolean(profile.mentorId),
      mentorshipProgress: profile.mentorshipProgress || {},
      skills: userSkills,
      skillNames: userSkills.map((skill) => skill.skillName),
      approvedEvidenceCount: evidence.approved || 0,
      pendingEvidenceCount: evidence.pending || 0,
      latestGapReport,
      createdAt: user.createdAt,
    };
  });
};

const evaluateStudent = (student, criteriaInput = {}) => {
  const criteria = serializeCriteria(criteriaInput);
  const reasons = [];
  const studentSkills = lowerList(student.skillNames);
  const studentCertifications = lowerList(student.certifications);
  const requiredSkills = lowerList(criteria.requiredSkills);
  const requiredCertifications = lowerList(criteria.certifications);
  const branches = lowerList(criteria.branches);
  const placementStatusRules = lowerList(criteria.placementStatuses);

  if (criteria.minCgpa && Number(student.cgpa || 0) < criteria.minCgpa) {
    reasons.push(`CGPA below ${criteria.minCgpa}`);
  }

  const missingSkills = requiredSkills.filter((skill) => !studentSkills.includes(skill));
  if (missingSkills.length) {
    reasons.push(`Missing skills: ${missingSkills.join(', ')}`);
  }

  if (branches.length && !branches.includes(String(student.branch || '').toLowerCase())) {
    reasons.push('Branch not eligible');
  }

  if (criteria.years.length && !criteria.years.includes(Number(student.year))) {
    reasons.push('Year not eligible');
  }

  const missingCertifications = requiredCertifications.filter((certification) => !studentCertifications.includes(certification));
  if (missingCertifications.length) {
    reasons.push(`Missing certifications: ${missingCertifications.join(', ')}`);
  }

  if (placementStatusRules.length && !placementStatusRules.includes(String(student.placementStatus || '').toLowerCase())) {
    reasons.push('Placement status not eligible');
  }

  if (criteria.mentorAssigned === 'assigned' && !student.mentorAssigned) {
    reasons.push('Mentor not assigned');
  }

  if (criteria.mentorAssigned === 'unassigned' && student.mentorAssigned) {
    reasons.push('Mentor already assigned');
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
};

const applyStudentFilters = (students, filters = {}, eligibilityByStudent = new Map()) => {
  const search = String(filters.search || filters.q || '').trim().toLowerCase();
  const skills = lowerList(filters.skills);
  const branches = lowerList(filters.branch || filters.branches);
  const years = parseNumberList(filters.year || filters.years);
  const certifications = lowerList(filters.certifications);
  const placement = lowerList(filters.placementStatus || filters.placementStatuses);
  const minCgpa = filters.minCgpa !== undefined && filters.minCgpa !== '' ? Number(filters.minCgpa) : null;
  const maxCgpa = filters.maxCgpa !== undefined && filters.maxCgpa !== '' ? Number(filters.maxCgpa) : null;
  const mentorAssigned = filters.mentorAssigned || '';
  const eligibilityStatus = filters.eligibilityStatus || '';

  return students.filter((student) => {
    const haystack = [
      student.name,
      student.email,
      student.branch,
      student.year,
      student.cgpa,
      student.placementStatus,
      ...student.skillNames,
      ...student.certifications,
    ].join(' ').toLowerCase();

    if (search && !haystack.includes(search)) return false;
    if (skills.length && !skills.every((skill) => lowerList(student.skillNames).includes(skill))) return false;
    if (branches.length && !branches.includes(String(student.branch || '').toLowerCase())) return false;
    if (years.length && !years.includes(Number(student.year))) return false;
    if (certifications.length && !certifications.every((certification) => lowerList(student.certifications).includes(certification))) return false;
    if (placement.length && !placement.includes(String(student.placementStatus || '').toLowerCase())) return false;
    if (Number.isFinite(minCgpa) && Number(student.cgpa || 0) < minCgpa) return false;
    if (Number.isFinite(maxCgpa) && Number(student.cgpa || 0) > maxCgpa) return false;
    if (mentorAssigned === 'assigned' && !student.mentorAssigned) return false;
    if (mentorAssigned === 'unassigned' && student.mentorAssigned) return false;
    if (eligibilityStatus) {
      const evaluation = eligibilityByStudent.get(student.id);
      if (!evaluation) return false;
      if (eligibilityStatus === 'eligible' && !evaluation.eligible) return false;
      if (eligibilityStatus === 'not_eligible' && evaluation.eligible) return false;
    }

    return true;
  });
};

const paginate = (items, query) => {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const start = (page - 1) * limit;

  return {
    items: items.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: items.length,
      pages: Math.max(1, Math.ceil(items.length / limit)),
    },
  };
};

const csvEscape = (value) => {
  const text = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const toCsv = (headers, rows) => [
  headers.map((header) => csvEscape(header.label)).join(','),
  ...rows.map((row) => headers.map((header) => csvEscape(row[header.key])).join(',')),
].join('\n');

const htmlEscape = (value) => String(value === undefined || value === null ? '' : value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const toExcelHtml = (headers, rows, title = 'Report') => `<!doctype html>
<html>
<head><meta charset="utf-8"><title>${htmlEscape(title)}</title></head>
<body>
<table border="1">
<thead><tr>${headers.map((header) => `<th>${htmlEscape(header.label)}</th>`).join('')}</tr></thead>
<tbody>
${rows.map((row) => `<tr>${headers.map((header) => `<td>${htmlEscape(row[header.key])}</td>`).join('')}</tr>`).join('')}
</tbody>
</table>
</body>
</html>`;

const getCriteriaForRequest = async (payload = {}) => {
  if (payload.criteriaId && mongoose.Types.ObjectId.isValid(payload.criteriaId)) {
    const criteria = await EligibilityCriteria.findById(payload.criteriaId).lean();
    if (criteria) return criteria;
  }

  if (payload.opportunityId && mongoose.Types.ObjectId.isValid(payload.opportunityId)) {
    const opportunity = await Opportunity.findById(payload.opportunityId).lean();
    if (opportunity) return opportunity.eligibility || {};
  }

  return payload.criteria || payload;
};

const getRecipientsByAudience = async (body) => {
  const students = await getStudentDirectory();

  if (body.audienceType === 'selected') {
    const selected = parseList(body.recipientIds);
    return students.filter((student) => selected.includes(student.id));
  }

  if (body.audienceType === 'eligible') {
    const criteria = await getCriteriaForRequest(body);
    return students.filter((student) => evaluateStudent(student, criteria).eligible);
  }

  if (body.audienceType === 'filtered') {
    return applyStudentFilters(students, body.filters || {});
  }

  return students;
};

export const getDashboard = asyncHandler(async (_req, res) => {
  const now = new Date();

  const [students, totalMentors, opportunities, announcements] = await Promise.all([
    getStudentDirectory(),
    User.countDocuments({ role: 'Mentor', isActive: true }),
    Opportunity.find()
      .populate('applications.studentId', 'name email')
      .sort({ createdAt: -1 })
      .lean(),
    Announcement.countDocuments(),
  ]);

  const activeOpportunities = opportunities.filter((opportunity) => opportunity.status === 'active');
  const eligibleStudentIds = new Set();
  activeOpportunities.forEach((opportunity) => {
    students.forEach((student) => {
      if (evaluateStudent(student, opportunity.eligibility).eligible) eligibleStudentIds.add(student.id);
    });
  });

  const recentApplications = opportunities
    .flatMap((opportunity) => (opportunity.applications || []).map((application) => ({
      opportunityId: opportunity._id,
      opportunityTitle: opportunity.title,
      category: opportunity.category,
      status: application.status,
      appliedAt: application.appliedAt,
      student: application.studentId,
    })))
    .sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0))
    .slice(0, 8);

  const upcomingEvents = opportunities
    .filter((opportunity) => opportunity.status === 'active' && (
      (opportunity.deadline && new Date(opportunity.deadline) >= now) ||
      (opportunity.eventDate && new Date(opportunity.eventDate) >= now)
    ))
    .sort((a, b) => new Date(a.deadline || a.eventDate) - new Date(b.deadline || b.eventDate))
    .slice(0, 8);

  res.json({
    stats: {
      totalStudents: students.length,
      totalMentors,
      totalOpportunities: opportunities.length,
      eligibleStudents: eligibleStudentIds.size,
      activeOpportunities: activeOpportunities.length,
      recentApplications: recentApplications.length,
      announcements,
      assignedMentors: students.filter((student) => student.mentorAssigned).length,
      placedStudents: students.filter((student) => student.placementStatus === 'placed').length,
    },
    recentApplications,
    upcomingEvents,
    placementBreakdown: placementStatuses.map((status) => ({
      status,
      count: students.filter((student) => student.placementStatus === status).length,
    })),
  });
});

export const listStudents = asyncHandler(async (req, res) => {
  const students = await getStudentDirectory();
  const criteria = req.query.criteriaId || req.query.opportunityId ? await getCriteriaForRequest(req.query) : null;
  const eligibilityByStudent = new Map();

  const withEligibility = students.map((student) => {
    if (!criteria) return student;
    const eligibility = evaluateStudent(student, criteria);
    eligibilityByStudent.set(student.id, eligibility);
    return { ...student, eligibility };
  });

  const filtered = applyStudentFilters(withEligibility, req.query, eligibilityByStudent);
  const { items, pagination } = paginate(filtered, req.query);

  res.json({
    students: items,
    pagination,
    filterOptions: {
      branches: [...new Set(students.map((student) => student.branch).filter(Boolean))].sort(),
      years: [...new Set(students.map((student) => student.year).filter(Boolean))].sort(),
      skills: [...new Set(students.flatMap((student) => student.skillNames).filter(Boolean))].sort(),
      certifications: [...new Set(students.flatMap((student) => student.certifications).filter(Boolean))].sort(),
      placementStatuses,
    },
  });
});

export const exportStudents = asyncHandler(async (req, res) => {
  const students = await getStudentDirectory();
  const filtered = applyStudentFilters(students, req.query);
  const csv = toCsv(
    [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'branch', label: 'Branch' },
      { key: 'year', label: 'Year' },
      { key: 'cgpa', label: 'CGPA' },
      { key: 'skillsText', label: 'Skills' },
      { key: 'certificationsText', label: 'Certifications' },
      { key: 'placementStatus', label: 'Placement Status' },
      { key: 'mentorName', label: 'Mentor' },
      { key: 'resumeUrl', label: 'Resume URL' },
      { key: 'portfolioUrl', label: 'Portfolio URL' },
    ],
    filtered.map((student) => ({
      ...student,
      skillsText: student.skillNames.join('; '),
      certificationsText: student.certifications.join('; '),
      mentorName: student.mentor?.name || '',
    }))
  );

  await logOfficerAction(req, 'STUDENT_EXPORT_DOWNLOADED', null, 'StudentProfile', { count: filtered.length });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
  res.send(csv);
});

export const updateStudentProfile = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ message: 'Invalid student ID' });
  }

  const allowed = ['branch', 'year', 'cgpa', 'certifications', 'placementStatus', 'resumeUrl', 'portfolioUrl', 'mentorshipProgress'];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  if (updates.placementStatus && !placementStatuses.includes(updates.placementStatus)) {
    return res.status(400).json({ message: 'Invalid placement status' });
  }

  if (updates.certifications !== undefined) updates.certifications = parseList(updates.certifications);

  const profile = await StudentProfile.findOneAndUpdate(
    { userId: studentId },
    { $set: updates, $setOnInsert: { userId: studentId } },
    { new: true, upsert: true, runValidators: true }
  );

  await logOfficerAction(req, 'STUDENT_PROFILE_UPDATED', studentId, 'StudentProfile', updates);
  res.json({ profile });
});

const getMentorRows = async () => {
  const mentors = await User.find({ role: 'Mentor', isActive: true })
    .select('name email expertiseAreas institution availability createdAt')
    .sort({ name: 1 })
    .lean();
  const mentorIds = mentors.map((mentor) => mentor._id);

  const [profiles, evidenceStats, ratingStats] = await Promise.all([
    StudentProfile.find({ mentorId: { $in: mentorIds } })
      .populate('userId', 'name email')
      .lean(),
    SkillEvidence.aggregate([
      { $match: { mentorId: { $in: mentorIds } } },
      { $group: { _id: { mentorId: '$mentorId', status: '$status' }, count: { $sum: 1 } } },
    ]),
    Rating.aggregate([
      { $match: { reviewee: { $in: mentorIds } } },
      { $group: { _id: '$reviewee', averageRating: { $avg: '$stars' }, totalRatings: { $sum: 1 } } },
    ]),
  ]);

  const assignedByMentor = profiles.reduce((map, profile) => {
    const key = toId(profile.mentorId);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(profile.userId);
    return map;
  }, new Map());
  const evidenceByMentor = evidenceStats.reduce((map, item) => {
    const key = toId(item._id.mentorId);
    if (!map.has(key)) map.set(key, {});
    map.get(key)[item._id.status] = item.count;
    return map;
  }, new Map());
  const ratingByMentor = new Map(ratingStats.map((item) => [toId(item._id), item]));

  return mentors.map((mentor) => {
    const key = toId(mentor._id);
    const evidence = evidenceByMentor.get(key) || {};
    const rating = ratingByMentor.get(key) || {};
    return {
      ...mentor,
      assignedStudents: assignedByMentor.get(key) || [],
      assignedCount: (assignedByMentor.get(key) || []).length,
      evidenceReviewed: evidence.approved || 0,
      pendingEvidence: evidence.pending || 0,
      averageRating: Number((rating.averageRating || 0).toFixed(1)),
      totalRatings: rating.totalRatings || 0,
    };
  });
};

export const listMentors = asyncHandler(async (_req, res) => {
  const mentors = await getMentorRows();
  res.json({ mentors });
});

export const assignMentor = asyncHandler(async (req, res) => {
  const { studentId, mentorId, progressStatus = 'active', notes = '' } = req.body;
  if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(mentorId)) {
    return res.status(400).json({ message: 'Valid student and mentor are required' });
  }

  const [student, mentor] = await Promise.all([
    User.findOne({ _id: studentId, role: 'Student', isActive: true }),
    User.findOne({ _id: mentorId, role: 'Mentor', isActive: true }),
  ]);

  if (!student || !mentor) {
    return res.status(404).json({ message: 'Student or mentor not found' });
  }

  const profile = await StudentProfile.findOneAndUpdate(
    { userId: studentId },
    {
      $set: {
        mentorId,
        mentorshipProgress: {
          status: progressStatus,
          notes,
          lastReviewedAt: new Date(),
        },
      },
      $setOnInsert: { userId: studentId },
    },
    { new: true, upsert: true, runValidators: true }
  ).populate('mentorId', 'name email');

  await Promise.all([
    createNotification({
      recipientId: studentId,
      type: 'MENTOR_ASSIGNED',
      title: 'Mentor assigned',
      message: `${mentor.name} has been assigned as your mentor.`,
      link: '/student/mentor-discovery',
    }),
    createNotification({
      recipientId: mentorId,
      type: 'SYSTEM',
      title: 'Student assigned',
      message: `${student.name} has been assigned to you for mentorship.`,
      link: '/mentor/students',
    }),
  ]);

  await logOfficerAction(req, 'MENTOR_ASSIGNED_BY_OFFICER', studentId, 'StudentProfile', {
    mentorId,
    mentorName: mentor.name,
    studentName: student.name,
  });

  res.json({ profile });
});

export const listOpportunities = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));

  const [opportunities, total] = await Promise.all([
    Opportunity.find(filter)
      .populate('createdBy', 'name email')
      .populate('applications.studentId', 'name email')
      .sort({ deadline: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Opportunity.countDocuments(filter),
  ]);

  res.json({
    opportunities,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    categories: opportunityCategories,
    statuses: opportunityStatuses,
  });
});

export const createOpportunity = asyncHandler(async (req, res) => {
  const payload = {
    title: req.body.title,
    organization: req.body.organization || '',
    category: req.body.category,
    description: req.body.description || '',
    location: req.body.location || '',
    externalUrl: req.body.externalUrl || '',
    deadline: req.body.deadline,
    eventDate: req.body.eventDate || null,
    status: req.body.status || 'active',
    eligibility: cleanEligibility(req.body.eligibility || req.body),
    createdBy: req.user.id,
  };

  if (!payload.title || !payload.category || !payload.deadline) {
    return res.status(400).json({ message: 'Title, category, and deadline are required' });
  }

  if (!opportunityCategories.includes(payload.category)) {
    return res.status(400).json({ message: 'Invalid opportunity category' });
  }

  const opportunity = await Opportunity.create(payload);
  await logOfficerAction(req, 'OPPORTUNITY_CREATED', opportunity._id, 'Opportunity', {
    title: opportunity.title,
    category: opportunity.category,
  });

  res.status(201).json({ opportunity });
});

export const updateOpportunity = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.category && !opportunityCategories.includes(updates.category)) {
    return res.status(400).json({ message: 'Invalid opportunity category' });
  }
  if (updates.status && !opportunityStatuses.includes(updates.status)) {
    return res.status(400).json({ message: 'Invalid opportunity status' });
  }
  if (updates.eligibility) updates.eligibility = cleanEligibility(updates.eligibility);

  const opportunity = await Opportunity.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!opportunity) {
    return res.status(404).json({ message: 'Opportunity not found' });
  }

  await logOfficerAction(req, 'OPPORTUNITY_UPDATED', opportunity._id, 'Opportunity', { title: opportunity.title });
  res.json({ opportunity });
});

export const deleteOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findByIdAndDelete(req.params.id);
  if (!opportunity) {
    return res.status(404).json({ message: 'Opportunity not found' });
  }

  await logOfficerAction(req, 'OPPORTUNITY_DELETED', opportunity._id, 'Opportunity', { title: opportunity.title });
  res.json({ success: true });
});

export const upsertApplication = asyncHandler(async (req, res) => {
  const { studentId, status = 'applied', note = '' } = req.body;
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ message: 'Valid student is required' });
  }
  if (!applicationStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid application status' });
  }

  const opportunity = await Opportunity.findById(req.params.id);
  if (!opportunity) {
    return res.status(404).json({ message: 'Opportunity not found' });
  }

  const existing = opportunity.applications.find((application) => toId(application.studentId) === studentId);
  if (existing) {
    existing.status = status;
    existing.note = note;
    existing.updatedAt = new Date();
  } else {
    opportunity.applications.push({ studentId, status, note });
  }

  await opportunity.save();
  await logOfficerAction(req, 'OPPORTUNITY_APPLICATION_TRACKED', opportunity._id, 'Opportunity', {
    studentId,
    status,
  });
  res.json({ opportunity });
});

export const listCriteria = asyncHandler(async (_req, res) => {
  const criteria = await EligibilityCriteria.find({ isActive: true })
    .populate('opportunityId', 'title category deadline')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ criteria });
});

export const createCriteria = asyncHandler(async (req, res) => {
  const criteria = await EligibilityCriteria.create({
    name: req.body.name,
    description: req.body.description || '',
    opportunityId: req.body.opportunityId || null,
    ...cleanEligibility(req.body),
    createdBy: req.user.id,
  });

  await logOfficerAction(req, 'ELIGIBILITY_CRITERIA_CREATED', criteria._id, 'EligibilityCriteria', {
    name: criteria.name,
  });
  res.status(201).json({ criteria });
});

export const updateCriteria = asyncHandler(async (req, res) => {
  const criteria = await EligibilityCriteria.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description || '',
      opportunityId: req.body.opportunityId || null,
      ...cleanEligibility(req.body),
    },
    { new: true, runValidators: true }
  );

  if (!criteria) {
    return res.status(404).json({ message: 'Eligibility criteria not found' });
  }

  await logOfficerAction(req, 'ELIGIBILITY_CRITERIA_UPDATED', criteria._id, 'EligibilityCriteria', {
    name: criteria.name,
  });
  res.json({ criteria });
});

export const deleteCriteria = asyncHandler(async (req, res) => {
  const criteria = await EligibilityCriteria.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!criteria) {
    return res.status(404).json({ message: 'Eligibility criteria not found' });
  }

  await logOfficerAction(req, 'ELIGIBILITY_CRITERIA_DELETED', criteria._id, 'EligibilityCriteria', {
    name: criteria.name,
  });
  res.json({ success: true });
});

export const checkEligibility = asyncHandler(async (req, res) => {
  const criteria = await getCriteriaForRequest(req.body);
  const students = await getStudentDirectory();
  const evaluated = students.map((student) => ({
    ...student,
    eligibility: evaluateStudent(student, criteria),
  }));

  const eligible = evaluated.filter((student) => student.eligibility.eligible);
  const nonEligible = evaluated.filter((student) => !student.eligibility.eligible);

  await logOfficerAction(req, 'ELIGIBILITY_CHECK_RUN', req.body.opportunityId || req.body.criteriaId || null, 'EligibilityCriteria', {
    eligible: eligible.length,
    nonEligible: nonEligible.length,
  });

  res.json({
    criteria: serializeCriteria(criteria),
    eligible,
    nonEligible,
    summary: {
      total: evaluated.length,
      eligible: eligible.length,
      nonEligible: nonEligible.length,
    },
  });
});

export const sendAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, audienceType = 'all', sendEmail = false, sendInApp = true } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required' });
  }

  const recipients = await getRecipientsByAudience({ ...req.body, audienceType });
  const recipientIds = recipients.map((recipient) => recipient.id);

  if (sendInApp) {
    await Promise.all(recipientIds.map((recipientId) => createNotification({
      recipientId,
      type: 'PLACEMENT_ANNOUNCEMENT',
      title,
      message,
      link: '/student/notifications',
    })));
  }

  const emailResult = sendEmail
    ? await sendBulkEmail({ recipients: recipients.map((recipient) => recipient.email), subject: title, text: message })
    : { status: 'not_requested', sent: 0, failed: 0, skipped: 0 };

  const announcement = await Announcement.create({
    senderId: req.user.id,
    title,
    message,
    audienceType,
    filters: req.body.filters || {},
    recipientIds,
    channels: { inApp: Boolean(sendInApp), email: Boolean(sendEmail) },
    emailStatus: emailResult.status,
    deliverySummary: {
      inAppCount: sendInApp ? recipientIds.length : 0,
      emailSent: emailResult.sent,
      emailFailed: emailResult.failed,
      emailSkipped: emailResult.skipped,
    },
  });

  await logOfficerAction(req, 'ANNOUNCEMENT_SENT', announcement._id, 'Announcement', {
    audienceType,
    recipients: recipientIds.length,
    emailStatus: emailResult.status,
  });

  res.status(201).json({ announcement, recipients: recipientIds.length });
});

export const listAnnouncements = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const [announcements, total] = await Promise.all([
    Announcement.find()
      .populate('senderId', 'name email')
      .sort({ sentAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Announcement.countDocuments(),
  ]);

  res.json({
    announcements,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

export const getReports = asyncHandler(async (_req, res) => {
  const [students, skillDistribution, opportunityStats, mentorCount] = await Promise.all([
    getStudentDirectory(),
    Skill.aggregate([
      { $group: { _id: '$skillName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    Opportunity.aggregate([
      {
        $project: {
          category: 1,
          status: 1,
          applicationCount: { $size: '$applications' },
        },
      },
      {
        $group: {
          _id: { category: '$category', status: '$status' },
          count: { $sum: 1 },
          applications: { $sum: '$applicationCount' },
        },
      },
    ]),
    User.countDocuments({ role: 'Mentor', isActive: true }),
  ]);

  const placementStats = placementStatuses.map((status) => ({
    status,
    count: students.filter((student) => student.placementStatus === status).length,
  }));
  const assigned = students.filter((student) => student.mentorAssigned).length;

  res.json({
    skillDistribution: skillDistribution.map((item) => ({ skill: item._id, count: item.count })),
    placementStats,
    internshipStats: opportunityStats
      .filter((item) => item._id.category === 'Internship')
      .map((item) => ({ status: item._id.status, count: item.count, applications: item.applications })),
    opportunityParticipation: opportunityStats.map((item) => ({
      category: item._id.category,
      status: item._id.status,
      opportunities: item.count,
      applications: item.applications,
    })),
    mentorAssignment: {
      totalMentors: mentorCount,
      assignedStudents: assigned,
      unassignedStudents: students.length - assigned,
      assignmentRate: students.length ? Math.round((assigned / students.length) * 100) : 0,
    },
  });
});

export const downloadReport = asyncHandler(async (req, res) => {
  const type = req.query.type || 'students';
  const format = req.query.format === 'xls' ? 'xls' : 'csv';
  let headers = [];
  let rows = [];

  if (type === 'opportunities') {
    const opportunities = await Opportunity.find().lean();
    headers = [
      { key: 'title', label: 'Title' },
      { key: 'organization', label: 'Organization' },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status' },
      { key: 'deadline', label: 'Deadline' },
      { key: 'applicationCount', label: 'Applications' },
    ];
    rows = opportunities.map((opportunity) => ({
      ...opportunity,
      deadline: opportunity.deadline ? new Date(opportunity.deadline).toISOString() : '',
      applicationCount: opportunity.applications?.length || 0,
    }));
  } else if (type === 'mentors') {
    headers = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'assignedCount', label: 'Assigned Students' },
      { key: 'evidenceReviewed', label: 'Evidence Reviewed' },
      { key: 'averageRating', label: 'Average Rating' },
    ];
    rows = await getMentorRows();
  } else {
    const students = await getStudentDirectory();
    headers = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'branch', label: 'Branch' },
      { key: 'year', label: 'Year' },
      { key: 'cgpa', label: 'CGPA' },
      { key: 'placementStatus', label: 'Placement Status' },
      { key: 'mentorName', label: 'Mentor' },
    ];
    rows = students.map((student) => ({ ...student, mentorName: student.mentor?.name || '' }));
  }

  await logOfficerAction(req, 'REPORT_DOWNLOADED', null, 'Report', { type, format, rows: rows.length });

  if (format === 'xls') {
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.xls"`);
    res.send(toExcelHtml(headers, rows, `${type} report`));
    return;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
  res.send(toCsv(headers, rows));
});

export const getActivityLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
  const filter = {
    actorRole: 'PlacementOfficer',
  };

  if (req.query.mine === 'true') {
    filter.actorId = req.user.id;
  }

  if (req.query.action) {
    filter.action = new RegExp(escapeRegex(req.query.action), 'i');
  }

  const [logs, total] = await Promise.all([
    AuditEvent.find(filter)
      .populate('actorId', 'name email')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditEvent.countDocuments(filter),
  ]);

  res.json({
    logs,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});
