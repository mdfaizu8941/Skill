import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import skillRoutes from './routes/skills.routes.js';
import exchangeRoutes from './routes/exchanges.routes.js';
import messageRoutes from './routes/messages.routes.js';
import ratingRoutes from './routes/ratings.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import profileRoutes from './routes/profile.routes.js';
import evidenceRoutes from './routes/evidence.routes.js';
import careerRoleRoutes from './routes/careerRole.routes.js';
import gapRoutes from './routes/gap.routes.js';
import roadmapRoutes from './routes/roadmap.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import adminRoutes from './routes/admin.routes.js';
import mentorRoutes from './routes/mentor.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import mentorRequestRoutes from './routes/mentorRequest.routes.js';

const app = express();

// Security & logging middleware
app.use(helmet());
app.use(morgan('dev'));

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'skill-bartering-system-api' });
});

// Existing routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/analytics', analyticsRoutes);

// New Skill Gap Intelligence routes
app.use('/api/profile', profileRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/career-roles', careerRoleRoutes);
app.use('/api/gap', gapRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', mentorRequestRoutes);

import AuditEvent from './models/AuditEvent.js';

// Global error handler
app.use(async (err, req, res, _next) => {
  const status = err.status || 500;
  
  // Only log actual crashes (5xx errors), ignore 400 Bad Requests, 401 Unauthorized, etc.
  if (status >= 500) {
    try {
      await AuditEvent.create({
        action: 'SYSTEM_ERROR',
        actorRole: 'System',
        metadata: {
          error: err.message,
          stack: err.stack,
          path: req.originalUrl,
          method: req.method
        },
        ip: req.ip || 'unknown'
      });
    } catch (e) {
      console.error('Failed to log error to AuditEvent:', e);
    }
  }

  res.status(status).json({ message: err.message || 'Server error' });
});

export default app;
