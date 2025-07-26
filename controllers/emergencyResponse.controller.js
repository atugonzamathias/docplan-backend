import { db } from '../config/firebase.js';
import { sendFCM } from '../services/fcm.service.js';

/**
 * GET emergency details by appointment ID
 * Route: GET /api/emergencies/:id
 */
export const getEmergencyById = async (req, res) => {
  const appointmentId = req.params.id;

  try {
    const ref = db.collection('appointments').doc(appointmentId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      return res.status(404).json({ message: 'Emergency appointment not found' });
    }

    const data = snapshot.data();

    // Only return emergency-relevant details
    const emergencyDetails = {
      id: snapshot.id,
      patientName: data.patientName || 'Unknown',
      reason: data.reason || 'No reason provided',
      notes: data.notes || 'None',
      dateTime: data.dateTime || '',
      status: data.status || 'pending',
      doctorName: data.doctorName || '',
    };

    return res.status(200).json(emergencyDetails);
  } catch (error) {
    console.error('Error fetching emergency:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST acknowledge emergency
 * Route: POST /api/emergencies/:id/acknowledge
 */
export const acknowledgeEmergency = async (req, res) => {
  const appointmentId = req.params.id;

  try {
    const ref = db.collection('appointments').doc(appointmentId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = snapshot.data();

    // Update appointment status
    await ref.update({ status: 'acknowledged' });

    // Notify patient via FCM
    const patientSnapshot = await db.collection('users').doc(appointment.patientId).get();
    const patient = patientSnapshot.data();

    if (patient?.fcmToken) {
      await sendFCM(
        patient.fcmToken,
        'Doctor Acknowledged Emergency',
        'A doctor has seen your emergency and will respond shortly.',
        {
          type: 'emergency_update',
          appointmentId,
          status: 'acknowledged',
        }
      );
    }

    return res.status(200).json({ message: 'Emergency acknowledged' });
  } catch (error) {
    console.error('Error acknowledging emergency:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST resolve emergency
 * Route: POST /api/emergencies/:id/resolve
 */
export const resolveEmergency = async (req, res) => {
  const appointmentId = req.params.id;

  try {
    // 🔹 1. Get appointment data
    const ref = db.collection('appointments').doc(appointmentId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = snapshot.data();
    const doctorId = appointment.doctorId;

    // 🔹 2. Update appointment status to 'resolved'
    await ref.update({ status: 'resolved' });

    // 🔹 3. Update the doctor's status to 'available'
    const doctorQuery = await db.collection('doctors')
      .where('userId', '==', doctorId)
      .limit(1)
      .get();

    if (!doctorQuery.empty) {
      const doctorDoc = doctorQuery.docs[0];
      await doctorDoc.ref.update({ status: 'available' });
    }

    // 🔹 4. Update emergency document with same doctorId to 'resolved'
    const emergencyQuery = await db.collection('emergencies')
      .where('doctorId', '==', doctorId)
      .where('status', '==', 'emergency') // Ensure it's the active one
      .limit(1)
      .get();

    if (!emergencyQuery.empty) {
      const emergencyDoc = emergencyQuery.docs[0];
      await emergencyDoc.ref.update({ status: 'resolved' });
    }

    // 🔹 5. Notify patient via FCM
    const patientSnapshot = await db.collection('users').doc(appointment.patientId).get();
    const patient = patientSnapshot.data();

    if (patient?.fcmToken) {
      await sendFCM(
        patient.fcmToken,
        'Emergency Resolved',
        'Your emergency has been resolved by a doctor.',
        {
          type: 'emergency_update',
          appointmentId,
          status: 'resolved',
        }
      );
    }

    return res.status(200).json({ message: 'Emergency resolved and all statuses updated.' });
  } catch (error) {
    console.error('Error resolving emergency:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
