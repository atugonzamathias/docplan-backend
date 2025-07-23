import { db } from '../config/firebase.js';
import { sendFCM } from '../services/fcm.service.js';
import {
  getAppointmentsWithinTwoHours,
  freezeAppointments,
  getPatientFcmTokens
} from '../services/appointment.service.js';

const listenForEmergencies = () => {
  console.log('🚨 Listening for emergency appointments...');

  db.collection('appointments')
    .where('isEmergency', '==', true)
    .where('status', '==', 'pending')
    .onSnapshot(async (snapshot) => {
      if (snapshot.empty) {
        console.log('🔍 No emergency appointments detected.');
        return;
      }

      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const emergency = change.doc.data();
          const emergencyId = change.doc.id;

          const doctorId = emergency.doctorId;
          const patientName = emergency.patientName || 'A patient';

          if (!doctorId) {
            console.warn(`❗ Skipping emergency ${emergencyId} — missing doctorId`);
            continue;
          }

          console.log(`🚑 Emergency triggered by ${patientName} for Doctor [${doctorId}]`);

          try {
            // 1. Freeze upcoming appointments for this doctor
            const appointments = await getAppointmentsWithinTwoHours(doctorId);
            await freezeAppointments(appointments);

            // 2. Notify affected patients
            const patientTokens = await getPatientFcmTokens(appointments);

            if (patientTokens.length > 0) {
              await Promise.all(
                patientTokens.map(token =>
                  sendFCM(token, 'Emergency Delay', 'Your appointment is delayed due to an emergency.', {
                    type: 'delay_notice',
                    appointmentId: emergencyId,
                  })
                )
              );
              console.log(`📲 Notified ${patientTokens.length} patients.`);
            } else {
              console.log('ℹ️ No patient tokens found for appointments.');
            }

            // 3. Notify the doctor
            const doctorSnap = await db.collection('users').doc(doctorId).get();
            const doctor = doctorSnap.data();

            if (doctor?.fcmToken) {
              await sendFCM(
                doctor.fcmToken,
                '🚨 Emergency Alert',
                `${patientName} triggered an emergency: ${emergency.reason || 'No reason provided'}`,
                {
                  type: 'emergency_alert',
                  appointmentId: emergencyId,
                  severity: emergency.notes || 'Not specified',
                }
              );
              console.log('✅ Doctor notified of the emergency.');
            } else {
              console.warn(`⚠️ No FCM token found for doctor [${doctorId}].`);
            }

            // 4. Optional: Mark the emergency as notified
            await db.collection('appointments').doc(emergencyId).update({ notified: true });
            console.log(`✅ Marked emergency [${emergencyId}] as notified.`);
          } catch (err) {
            console.error(`❌ Error processing emergency [${emergencyId}]:`, err);
          }
        }
      }
    }, (error) => {
      console.error('❌ Error listening to emergency appointments:', error);
    });
};

export default listenForEmergencies;
