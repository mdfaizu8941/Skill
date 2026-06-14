import Skill from '../models/Skill.js';

export const listSkills = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category) {
      filter.category = new RegExp(category, 'i');
    }

    if (search) {
      filter.$or = [
        { skillName: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') },
      ];
    }

    const skills = await Skill.find(filter)
      .populate('user', 'name email profilePic bio institution')
      .sort({ createdAt: -1 });

    return res.json({ skills });
  } catch (error) {
    return next(error);
  }
};

export const mySkills = async (req, res, next) => {
  try {
    const skills = await Skill.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json({ skills });
  } catch (error) {
    return next(error);
  }
};

export const createSkill = async (req, res, next) => {
  try {
    const { skillName, category, level, description, wantsToLearn = [] } = req.body;

    if (!skillName || !category) {
      return res.status(400).json({ message: 'Skill name and category are required' });
    }

    const skill = await Skill.create({
      user: req.user.id,
      skillName,
      category,
      level,
      description,
      wantsToLearn: Array.isArray(wantsToLearn) ? wantsToLearn : [],
    });

    return res.status(201).json({ skill });
  } catch (error) {
    return next(error);
  }
};

export const updateSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    return res.json({ skill });
  } catch (error) {
    return next(error);
  }
};

export const deleteSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    return res.json({ message: 'Skill deleted' });
  } catch (error) {
    return next(error);
  }
};
