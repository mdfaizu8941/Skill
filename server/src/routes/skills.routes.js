import { Router } from 'express'
import {
  createSkill,
  deleteSkill,
  listSkills,
  mySkills,
  updateSkill,
} from '../controllers/skills.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { permit } from '../middleware/rbac.js'
import Skill from '../models/Skill.js'

const router = Router()

router.get('/', listSkills)
router.get('/mine', requireAuth, mySkills)
router.post('/', requireAuth, createSkill)
router.put('/:id', requireAuth, updateSkill)
router.delete('/:id', requireAuth, deleteSkill)

router.post('/bulk', requireAuth, permit('Student'), async (req, res) => {
  try {
    const { skills } = req.body
    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({ message: 'skills array required' })
    }
    const created = await Promise.all(
      skills.map(skillName =>
        Skill.findOneAndUpdate(
          { skillName: skillName.trim(), user: req.user.id },
          { skillName: skillName.trim(), user: req.user.id, category: 'Extracted', level: 'Beginner' },
          { upsert: true, new: true }
        )
      )
    )
    res.json({ skills: created })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router