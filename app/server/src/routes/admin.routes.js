import { Router } from 'express';
import {
  dashboard, listUsers, listVerifications, reviewVerification, listPayouts, createPayout, runWeeklyPayouts, payPayout, updateCommission, listComplaints, updateComplaint,
} from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/dashboard', dashboard);
router.get('/users', listUsers);
router.get('/verifications', listVerifications);
router.patch('/verifications/:id', reviewVerification);
router.get('/payouts', listPayouts);
router.post('/payouts', createPayout);
router.post('/payouts/weekly', runWeeklyPayouts);
router.patch('/payouts/:id/pay', payPayout);
router.patch('/commission', updateCommission);
router.get('/complaints', listComplaints);
router.patch('/complaints/:id', updateComplaint);
export default router;
