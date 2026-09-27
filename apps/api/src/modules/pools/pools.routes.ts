import { Router } from 'express';
import {acceptPool,availableRides,arrived,start,complete,myPools,} from './pools.controllers.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('DRIVER'));

router.get('/available', availableRides);
router.post('/create', acceptPool);
router.patch('/:id/arrived', arrived);
router.patch('/:id/start', start);
router.patch('/:id/complete', complete);
router.get('/my', myPools);

export default router;