import express from 'express';
import {
  acknowledgeEmergency,
  resolveEmergency,
} from '../controllers/emergencyResponse.controller.js';

const router = express.Router();

router.post('/:id/acknowledge', acknowledgeEmergency);
router.post('/:id/resolve', resolveEmergency);

export default router;