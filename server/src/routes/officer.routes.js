import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';
import * as officerController from '../controllers/officer.controller.js';


const router = Router();
const officerRoles = ['PlacementOfficer', 'Admin'];

router.use(requireAuth, permit(...officerRoles));

router.get('/dashboard', officerController.getDashboard);

router.get('/students', officerController.listStudents);
router.get('/students/export', officerController.exportStudents);
router.patch('/students/:studentId/profile', officerController.updateStudentProfile);

router.get('/mentors', officerController.listMentors);
router.post('/mentors/assign', officerController.assignMentor);

router.get('/opportunities', officerController.listOpportunities);
router.post('/opportunities', officerController.createOpportunity);
router.patch('/opportunities/:id', officerController.updateOpportunity);
router.delete('/opportunities/:id', officerController.deleteOpportunity);
router.post('/opportunities/:id/applications', officerController.upsertApplication);

router.get('/eligibility-criteria', officerController.listCriteria);
router.post('/eligibility-criteria', officerController.createCriteria);
router.patch('/eligibility-criteria/:id', officerController.updateCriteria);
router.delete('/eligibility-criteria/:id', officerController.deleteCriteria);
router.post('/eligibility/check', officerController.checkEligibility);

router.get('/announcements', officerController.listAnnouncements);
router.post('/announcements', officerController.sendAnnouncement);

router.get('/reports', officerController.getReports);
router.get('/reports/download', officerController.downloadReport);
router.get('/activity-logs', officerController.getActivityLogs);

export default router;
