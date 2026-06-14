import mongoose from 'mongoose';
import Skill from '../models/Skill.js';
import Exchange from '../models/Exchange.js';
import Message from '../models/Message.js';
import Rating from '../models/Rating.js';
import User from '../models/User.js';
import GapReport from '../models/GapReport.js';
import Roadmap from '../models/Roadmap.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const [skillCount, exchangeCounts, unreadMessages, ratingSummary] = await Promise.all([
      Skill.countDocuments({ user: req.user.id }),
      Exchange.aggregate([
        { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
        { $group: { _id: { $toLower: '$status' }, total: { $sum: 1 } } },
      ]),
      Message.countDocuments({
        receiver: req.user.id,
        $or: [{ isRead: false }, { readAt: null }],
      }),
      Rating.aggregate([
        { $match: { reviewee: userId } },
        { $group: { _id: null, averageStars: { $avg: '$stars' }, total: { $sum: 1 } } },
      ]),
    ]);

    const exchanges = exchangeCounts.reduce((result, item) => {
      result[item._id] = item.total;
      return result;
    }, { pending: 0, accepted: 0, rejected: 0 });

    const rating = ratingSummary[0] || { averageStars: 0, total: 0 };
    const badges = [];
    const accepted = exchanges.accepted || 0;

    if (accepted >= 1) badges.push('Beginner Mentor');
    if (accepted >= 10) badges.push('Community Helper');
    if (accepted >= 50) badges.push('Skill Master');

    return res.json({
      summary: {
        skills: skillCount,
        exchanges,
        unreadMessages,
        rating: {
          average: Number((rating.averageStars || 0).toFixed(1)),
          total: rating.total,
        },
        badges,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getPlacementAnalytics = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalMentors,
      totalReports,
      avgScoreResult,
      topRoles,
      recentReports,
      roadmapStats
    ] = await Promise.all([
      User.countDocuments({ role: 'Student', isActive: true }),
      User.countDocuments({ role: 'Mentor', isActive: true }),
      GapReport.countDocuments(),
      GapReport.aggregate([
        { $group: { _id: null, avg: { $avg: '$compatibilityScore' } } }
      ]),
      GapReport.aggregate([
        { $group: { _id: '$targetRole', count: { $sum: 1 }, avgScore: { $avg: '$compatibilityScore' } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      GapReport.find()
        .populate('studentId', 'name email')
        .sort({ generatedAt: -1 })
        .limit(10),
      Roadmap.aggregate([
        { $group: {
          _id: '$overallStatus',
          count: { $sum: 1 }
        }}
      ])
    ])
  
    const averageScore = avgScoreResult[0]?.avg?.toFixed(1) || 0
  
    res.json({
      totalStudents,
      totalMentors,
      totalReports,
      averageScore,
      topRoles,
      recentReports,
      roadmapStats
    })
  } catch (error) {
    return next(error);
  }
};
