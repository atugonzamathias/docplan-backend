import express from 'express';
import {
  getEmergencyById,
  acknowledgeEmergency,
  resolveEmergency,
} from '../controllers/emergencyResponse.controller.js';

const router = express.Router();

router.get('/:id', getEmergencyById); // <-- Add this GET route
router.post('/:id/acknowledge', acknowledgeEmergency);
router.post('/:id/resolve', resolveEmergency);

export default router;
