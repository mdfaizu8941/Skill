import { asyncHandler } from '../utils/asyncHandler.js';
import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';

export const getStudents = asyncHandler(async (req, res) => {
  // Find all student profiles assigned to this mentor
  const profiles = await StudentProfile.find({ mentorId: req.user.id })
    .populate('userId', 'name email profilePic institution isActive')
    .lean();

  // Also enrich with user data
  const students = profiles.map((profile) => ({
    profile,
    user: profile.userId,
  }));

  return res.json({ students });
});
