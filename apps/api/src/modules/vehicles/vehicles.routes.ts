import { Router } from 'express';
import { registerVehicle, updateStatus, getVehicle } from "./vehicles.controllers.js"
import { authenticate } from "../../middleware/auth.middleware.js"
import { requireRole } from "../../middleware/role.middleware.js"

const router = Router();

router.use(authenticate);
router.use(requireRole('DRIVER'));

router.post('/', registerVehicle);
router.patch('/status', updateStatus);
router.get('/mine', getVehicle);

export default router;