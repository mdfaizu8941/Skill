import { asyncHandler } from '../utils/asyncHandler.js';
import Roadmap from '../models/Roadmap.js';
import GapReport from '../models/GapReport.js';
import { generateRoadmap as generateRoadmapAI } from '../services/groqService.js';
import { createNotification } from '../services/notificationService.js';
import { audit } from '../services/auditService.js';

export const generate = asyncHandler(async (req, res) => {
  const { gapReportId } = req.body;

  if (!gapReportId) {
    return res.status(400).json({ message: 'gapReportId is required' });
  }

  const gapReport = await GapReport.findById(gapReportId).populate('careerRoleId', 'title');

  if (!gapReport) {
    return res.status(404).json({ message: 'Gap report not found' });
  }

  if (gapReport.studentId.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  // Duplicate prevention: if active roadmap exists for same gap report, return existing
  const existingRoadmap = await Roadmap.findOne({
    studentId: req.user.id,
    gapReportId: gapReport._id,
    overallStatus: 'active',
  });

  if (existingRoadmap) {
    return res.json({ duplicate: true, roadmap: existingRoadmap });
  }

  const careerRoleTitle = gapReport.careerRoleId?.title || 'Target Role';

  // Generate roadmap steps using AI
  const { steps: generatedSteps, aiMetadata } = await generateRoadmapAI(gapReport.missingSkills, careerRoleTitle);

  // Map generated steps to our schema format
  const steps = generatedSteps.map((step, index) => ({
    title: step.title || `Step ${index + 1}`,
    description: step.description || '',
    resourceUrl: step.resourceUrl || null,
    status: 'pending',
    order: step.order || index + 1,
  }));

  const roadmap = await Roadmap.create({
    studentId: req.user.id,
    gapReportId: gapReport._id,
    careerRoleId: gapReport.careerRoleId?._id || gapReport.careerRoleId || null,
    steps,
    overallStatus: 'active',
    aiMetadata,
  });

  // Send notification to student
  await createNotification({
    recipientId: req.user.id,
    type: 'ROADMAP_GENERATED',
    title: 'Roadmap Generated',
    message: `Your personalized learning roadmap has been created.`,
    link: '/student/roadmap'
  })

  await audit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'ROADMAP_GENERATED',
    targetId: roadmap._id,
    targetModel: 'Roadmap',
    metadata: {
      gapReportId: gapReportId,
      stepCount: steps.length,
      careerRoleTitle: careerRoleTitle
    },
    ip: req.ip || 'unknown'
  })

  return res.status(201).json({ roadmap });
});

export const getMy = asyncHandler(async (req, res) => {
  const roadmaps = await Roadmap.find({ studentId: req.user.id, overallStatus: 'active' })
    .populate('careerRoleId', 'title industry')
    .populate('gapReportId', 'compatibilityScore')
    .sort({ updatedAt: -1 });

  return res.json({ roadmaps });
});

export const updateStep = asyncHandler(async (req, res) => {
  const { stepId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'in_progress', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  // Find a roadmap belonging to this student that contains the step
  const roadmap = await Roadmap.findOne({
    studentId: req.user.id,
    'steps._id': stepId,
  });

  if (!roadmap) {
    return res.status(404).json({ message: 'Step not found in your roadmaps' });
  }

  // Update the specific step
  const step = roadmap.steps.id(stepId);
  if (!step) {
    return res.status(404).json({ message: 'Step not found' });
  }

  step.status = status;

  // Recalculate overall status
  const allCompleted = roadmap.steps.every((s) => s.status === 'completed');
  if (allCompleted) {
    roadmap.overallStatus = 'completed';
  }

  await roadmap.save();

  return res.json({ roadmap });
});
