import { db } from '../config/firebase.js';
import { sendFCM } from '../services/fcm.service.js';
import {
  getAppointmentsWithinTwoHours,
  freezeAppointments,
  getPatientFcmTokens
} from '../services/appointment.service.js';

const listenForEmergencies = () => {
  db.collection('appointments')
    .where('isEmergency', '==', true)
    .where('status', '==', 'pending')
    .onSnapshot(async (snapshot) => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          const emergency = change.doc.data();
          const doctorId = emergency.doctorId;

          // 1. Freeze doctor's upcoming appointments
          const appointments = await getAppointmentsWithinTwoHours(doctorId);
          await freezeAppointments(appointments);

          // 2. Notify affected patients
          const patientTokens = await getPatientFcmTokens(appointments);
          await Promise.all(patientTokens.map(token =>
            sendFCM(token, 'Emergency Delay', 'Your appointment is delayed due to an emergency.', {
              type: 'delay_notice',
              appointmentId: change.doc.id,
            })
          ));

          // 3. Fetch doctor FCM token from users collection
          const doctorSnapshot = await db.collection('users').doc(doctorId).get();
          const doctor = doctorSnapshot.data();

          if (doctor?.fcmToken) {
            await sendFCM(
              doctor.fcmToken,
              'Emergency Alert',
              `${emergency.patientName} triggered: ${emergency.reason}`,
              {
                type: 'emergency_alert',
                appointmentId: change.doc.id,
                severity: emergency.notes,
              }
            );
          }

          // 4. Mark as notified (optional)
          await db.collection('appointments').doc(change.doc.id).update({ notified: true });
        }
      });
    });
};

export default listenForEmergencies;
