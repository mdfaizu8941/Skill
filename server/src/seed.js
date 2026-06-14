import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import CareerRole from './models/CareerRole.js';

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('MONGODB_URI is required in .env');
  process.exit(1);
}

const seedUsers = [
  {
    name: 'Alice Student',
    email: 'student@sgip.test',
    password: 'password123',
    role: 'Student',
    institution: 'MIT',
  },
  {
    name: 'Bob Mentor',
    email: 'mentor@sgip.test',
    password: 'password123',
    role: 'Mentor',
    institution: 'Stanford',
  },
  {
    name: 'Carol Officer',
    email: 'officer@sgip.test',
    password: 'password123',
    role: 'PlacementOfficer',
    institution: 'Harvard',
  },
  {
    name: 'Dave Admin',
    email: 'admin@sgip.test',
    password: 'password123',
    role: 'Admin',
    institution: 'SGIP HQ',
  },
];

const seedCareerRoles = [
  {
    title: 'Frontend Developer',
    description: 'Build modern web interfaces using React, Vue, or Angular',
    industry: 'Technology',
    requiredSkills: [
      { skillName: 'JavaScript', level: 'advanced', weight: 10 },
      { skillName: 'React', level: 'advanced', weight: 9 },
      { skillName: 'CSS', level: 'intermediate', weight: 7 },
      { skillName: 'HTML', level: 'intermediate', weight: 6 },
      { skillName: 'TypeScript', level: 'intermediate', weight: 7 },
      { skillName: 'Git', level: 'beginner', weight: 4 },
      { skillName: 'Responsive Design', level: 'intermediate', weight: 6 },
    ],
  },
  {
    title: 'Data Analyst',
    description: 'Analyse datasets and build dashboards to drive business decisions',
    industry: 'Analytics',
    requiredSkills: [
      { skillName: 'Python', level: 'advanced', weight: 9 },
      { skillName: 'SQL', level: 'advanced', weight: 10 },
      { skillName: 'Excel', level: 'intermediate', weight: 6 },
      { skillName: 'Tableau', level: 'intermediate', weight: 7 },
      { skillName: 'Statistics', level: 'advanced', weight: 8 },
      { skillName: 'Data Visualization', level: 'intermediate', weight: 6 },
    ],
  },
  {
    title: 'Backend Engineer',
    description: 'Design and maintain server-side applications, APIs, and databases',
    industry: 'Technology',
    requiredSkills: [
      { skillName: 'Node.js', level: 'advanced', weight: 10 },
      { skillName: 'Python', level: 'intermediate', weight: 7 },
      { skillName: 'SQL', level: 'advanced', weight: 8 },
      { skillName: 'MongoDB', level: 'intermediate', weight: 7 },
      { skillName: 'REST APIs', level: 'advanced', weight: 9 },
      { skillName: 'Docker', level: 'intermediate', weight: 6 },
      { skillName: 'Git', level: 'beginner', weight: 4 },
    ],
  },
  {
    title: 'DevOps Engineer',
    description: 'Automate infrastructure, CI/CD pipelines, and cloud deployments',
    industry: 'Technology',
    requiredSkills: [
      { skillName: 'Docker', level: 'advanced', weight: 10 },
      { skillName: 'Kubernetes', level: 'advanced', weight: 9 },
      { skillName: 'AWS', level: 'advanced', weight: 9 },
      { skillName: 'Linux', level: 'advanced', weight: 8 },
      { skillName: 'CI/CD', level: 'advanced', weight: 8 },
      { skillName: 'Terraform', level: 'intermediate', weight: 7 },
      { skillName: 'Python', level: 'intermediate', weight: 5 },
      { skillName: 'Bash', level: 'intermediate', weight: 6 },
    ],
  },
  {
    title: 'ML Engineer',
    description: 'Build and deploy machine learning models at scale',
    industry: 'AI / Machine Learning',
    requiredSkills: [
      { skillName: 'Python', level: 'advanced', weight: 10 },
      { skillName: 'TensorFlow', level: 'advanced', weight: 9 },
      { skillName: 'PyTorch', level: 'advanced', weight: 9 },
      { skillName: 'Statistics', level: 'advanced', weight: 8 },
      { skillName: 'Linear Algebra', level: 'intermediate', weight: 7 },
      { skillName: 'SQL', level: 'intermediate', weight: 5 },
      { skillName: 'Docker', level: 'intermediate', weight: 6 },
      { skillName: 'MLOps', level: 'intermediate', weight: 7 },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Seed users
    console.log('\n--- Seeding Users ---');
    for (const userData of seedUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`  [SKIP] ${userData.role}: ${userData.email} (already exists, id: ${existing._id})`);
        continue;
      }

      const passwordHash = await bcrypt.hash(userData.password, 12);
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        passwordHash,
        institution: userData.institution,
        role: userData.role,
      });
      console.log(`  [CREATED] ${userData.role}: ${userData.email} (id: ${user._id})`);
    }

    // Seed career roles
    console.log('\n--- Seeding Career Roles ---');
    for (const roleData of seedCareerRoles) {
      const existing = await CareerRole.findOne({ title: roleData.title });
      if (existing) {
        console.log(`  [SKIP] ${roleData.title} (already exists, id: ${existing._id})`);
        continue;
      }

      const role = await CareerRole.create(roleData);
      console.log(`  [CREATED] ${roleData.title} (id: ${role._id})`);
    }

    console.log('\n--- Seed Complete ---');
    console.log('Test credentials: password123 for all users');
    console.log('Emails: student@sgip.test, mentor@sgip.test, officer@sgip.test, admin@sgip.test');
  } catch (error) {
    console.error('Seed failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
