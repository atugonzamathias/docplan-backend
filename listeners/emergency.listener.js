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

          if (!doctorId || typeof doctorId !== 'string') {
            console.warn(`❗ Skipping emergency ${emergencyId} — missing or invalid doctorId`);
            continue;
          }

          console.log(`🚑 Emergency triggered by ${patientName} for Doctor [${doctorId}]`);

          try {
            // ✅ STEP 1: Freeze appointments
            const appointments = await getAppointmentsWithinTwoHours(doctorId);
            console.log(`🧊 Appointments to freeze: ${appointments.length}`);

            if (appointments.length === 0) {
              console.warn(`⚠️ No upcoming appointments found for doctor [${doctorId}]`);
            }

            await freezeAppointments(appointments);

            // ✅ STEP 2: Notify affected patients
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

            // ✅ STEP 3: Notify doctor
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

            // ✅ STEP 4: Mark emergency as notified
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
