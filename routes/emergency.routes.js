import express from 'express';
import { resolveEmergency } from '../controllers/emergency.controller.js';
import { triggerEmergency } from '../controllers/emergencyTrigger.controller.js';
import { acknowledgeEmergency } from '../controllers/emergencyAcknowledge.controller.js';
const router = express.Router();

router.post('/trigger', triggerEmergency);
router.patch('/:id/acknowledge', acknowledgeEmergency);
router.patch('/:id/resolve', resolveEmergency);

export default router;