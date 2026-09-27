import { Router } from 'express';
import { estimateFare, listZones } from './fares.controllers.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/estimate', estimateFare);
router.get('/zones', listZones);

export default router;