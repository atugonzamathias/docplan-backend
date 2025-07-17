import { db } from '../config/firebase.js';
import { sendFCM } from '../services/fcm.service.js';

export const acknowledgeEmergency = async (req, res) => {
  const appointmentId = req.params.id;
  try {
    const ref = db.collection('appointments').doc(appointmentId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return res.status(404).json({ message: 'Appointment not found' });

    const appointment = snapshot.data();

    // Optional: Update the appointment to reflect acknowledgment
    await ref.update({ status: 'acknowledged' });

    // Fetch patient FCM token from users collection
    const patientSnapshot = await db.collection('users').doc(appointment.patientId).get();
    const patient = patientSnapshot.data();

    if (patient?.fcmToken) {
      await sendFCM(patient.fcmToken, 'Doctor Acknowledged Emergency', 'A doctor has seen your emergency and will respond shortly.', {
        type: 'emergency_update',
        appointmentId,
        status: 'acknowledged',
      });
    }

    return res.status(200).json({ message: 'Emergency acknowledged' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const resolveEmergency = async (req, res) => {
  const appointmentId = req.params.id;
  try {
    const ref = db.collection('appointments').doc(appointmentId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return res.status(404).json({ message: 'Appointment not found' });

    const appointment = snapshot.data();

    await ref.update({ status: 'resolved' });

    // Fetch patient FCM token from users collection
    const patientSnapshot = await db.collection('users').doc(appointment.patientId).get();
    const patient = patientSnapshot.data();

    if (patient?.fcmToken) {
      await sendFCM(patient.fcmToken, 'Emergency Resolved', 'Your emergency has been resolved by a doctor.', {
        type: 'emergency_update',
        appointmentId,
        status: 'resolved',
      });
    }

    return res.status(200).json({ message: 'Emergency resolved' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
