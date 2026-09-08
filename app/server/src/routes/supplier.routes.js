import { Router } from 'express';
import {
  dashboard, submitVerification, retailers, inventory, earnings, notifications, markNotificationRead,
} from '../controllers/supplier.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('supplier'));
router.get('/dashboard', dashboard);
router.post('/verification', submitVerification);
router.get('/retailers', retailers);
router.get('/inventory', inventory);
router.get('/earnings', earnings);
router.get('/notifications', notifications);
router.patch('/notifications/:id/read', markNotificationRead);
export default router;
