import { Router } from 'express';
import { placeOrder, myOrders, getOrder, updateStatus } from '../controllers/order.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.post('/', requireRole('retailer'), placeOrder);
router.get('/', myOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', updateStatus);
export default router;
