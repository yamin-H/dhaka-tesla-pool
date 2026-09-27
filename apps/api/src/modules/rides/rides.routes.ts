import { Router } from 'express';
import { createRide, myRides, rideById, cancel } from './rides.controllers.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('PASSENGER'));

router.post('/request', createRide);
router.get('/my', myRides);
router.get('/:id', rideById);
router.patch('/:id/cancel', cancel);

export default router;