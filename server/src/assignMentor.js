import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

await mongoose.connect(process.env.MONGODB_URI)

const User = (await import('./models/User.js')).default
const StudentProfile = (await import('./models/StudentProfile.js')).default

const mentor = await User.findOne({ role: 'Mentor' })
const student = await User.findOne({ role: 'Student' })

if (!mentor || !student) {
  console.log('Mentor or student not found')
  process.exit(1)
}

await StudentProfile.findOneAndUpdate(
  { userId: student._id },
  { userId: student._id, mentorId: mentor._id },
  { upsert: true, new: true }
)

console.log(`Assigned ${student.email} to mentor ${mentor.email}`)
await mongoose.disconnect()
process.exit(0)