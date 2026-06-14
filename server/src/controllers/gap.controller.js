import { asyncHandler } from '../utils/asyncHandler.js'
import CareerRole from '../models/CareerRole.js'
import GapReport from '../models/GapReport.js'
import Skill from '../models/Skill.js'
import { runGapEngine } from '../services/gapEngine.js'
import {
  generateGapExplanation,
  generateRoadmap,
  extractSkillsFromJD,
} from '../services/groqService.js'
import { createNotification } from '../services/notificationService.js'

export const analyse = asyncHandler(async (req, res) => {
  const { careerRoleId, targetRole, jobDescription, mode } = req.body

  const studentSkillDocs = await Skill.find({ user: req.user.id })
  const studentSkills = studentSkillDocs.map(s => s.skillName)

  if (studentSkills.length === 0) {
    return res.status(400).json({
      message: 'No skills found. Add skills or parse your resume first.'
    })
  }

  let roleTitle = ''
  let requiredSkills = []

  if (mode === 'jd') {
    if (!jobDescription || jobDescription.trim().length < 50) {
      return res.status(400).json({ message: 'Job description too short. Minimum 50 characters.' })
    }
    roleTitle = targetRole || 'Custom Role (JD)'
    requiredSkills = await extractSkillsFromJD(jobDescription)
    if (requiredSkills.length === 0) {
      return res.status(400).json({ message: 'Could not extract skills from job description.' })
    }
  } else {
    if (!targetRole && !careerRoleId) {
      return res.status(400).json({ message: 'Target role is required.' })
    }
    if (careerRoleId) {
      const role = await CareerRole.findById(careerRoleId)
      if (!role) return res.status(404).json({ message: 'Career role not found' })
      roleTitle = role.title
      requiredSkills = role.requiredSkills.map(r => ({
        skillName: r.skillName,
        level: r.level,
        weight: r.weight,
      }))
    } else {
      roleTitle = targetRole
      requiredSkills = await extractSkillsFromJD(
        `List the required technical and soft skills for a ${targetRole} position`
      )
      if (requiredSkills.length === 0) {
        return res.status(400).json({ message: 'Could not generate skill requirements for this role.' })
      }
    }
  }

  const { compatibilityScore, matchedSkills, missingSkills } = runGapEngine(
    studentSkills,
    requiredSkills
  )

  const explanation = await generateGapExplanation(matchedSkills, missingSkills, roleTitle)

  const report = await GapReport.create({
    studentId: req.user.id,
    careerRoleId: careerRoleId || null,
    targetRole: roleTitle,
    compatibilityScore,
    matchedSkills,
    missingSkills,
    explanation,
    generatedAt: new Date(),
  })

  // Send notification to student
  await createNotification({
    recipientId: req.user.id,
    type: 'GAP_ANALYSIS_COMPLETE',
    title: 'Gap Analysis Complete',
    message: `Your gap analysis for "${roleTitle}" is ready. Compatibility: ${compatibilityScore}%`,
    link: '/student/gap-analysis'
  })

  res.json(report)
})

export const getReports = asyncHandler(async (req, res) => {
  const reports = await GapReport.find({ studentId: req.user.id })
    .sort({ generatedAt: -1 })
    .limit(20)
  res.json({ reports })
})

export const getReport = asyncHandler(async (req, res) => {
  const report = await GapReport.findOne({
    _id: req.params.id,
    studentId: req.user.id,
  })
  if (!report) return res.status(404).json({ message: 'Report not found' })
  res.json(report)
})
