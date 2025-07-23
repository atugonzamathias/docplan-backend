import { db, admin } from '../config/firebase.js'; // admin must be initialized in firebase.js

// ✅ Get appointments within 2 hours for a doctor (excluding emergencies)
export const getAppointmentsWithinTwoHours = async (doctorId) => {
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  console.log(`⏰ Looking for appointments from ${now.toISOString()} to ${twoHoursLater.toISOString()}`);

  try {
    const snapshot = await db.collection('appointments')
      .where('doctorId', '==', doctorId)
      .where('isEmergency', '==', false)
      .where('dateTime', '>=', admin.firestore.Timestamp.fromDate(now))
      .where('dateTime', '<=', admin.firestore.Timestamp.fromDate(twoHoursLater))
      .get();

    if (snapshot.empty) {
      console.log('🔍 No appointments found within the next 2 hours.');
      return [];
    }

    const appointments = snapshot.docs.map(doc => {
      const data = doc.data();
      const dateTime = data.dateTime?.toDate?.().toISOString?.();
      console.log(`📄 Appointment found: ${doc.id} at ${dateTime} (Status: ${data.status})`);
      return { id: doc.id, ...data };
    });

    return appointments;
  } catch (error) {
    console.error('❌ Error fetching appointments within 2 hours:', error);
    return [];
  }
};

// ✅ Freeze appointments by setting status to 'frozen'
export const freezeAppointments = async (appointments) => {
  if (!appointments || appointments.length === 0) {
    console.log('⚠️ No appointments to freeze.');
    return;
  }

  try {
    const updates = appointments.map(appt =>
      db.collection('appointments').doc(appt.id).update({ status: 'frozen' })
    );

    await Promise.all(updates);
    console.log(`❄️ Successfully froze ${appointments.length} appointment(s).`);
  } catch (error) {
    console.error('❌ Error freezing appointments:', error);
  }
};

// ✅ Fetch patient FCM tokens from user documents
export const getPatientFcmTokens = async (appointments) => {
  const tokens = [];

  if (!appointments || appointments.length === 0) {
    console.log('⚠️ No appointments provided for FCM token lookup.');
    return tokens;
  }

  for (const appt of appointments) {
    try {
      const userSnap = await db.collection('users').doc(appt.patientId).get();
      const user = userSnap.data();

      if (user?.fcmToken) {
        tokens.push(user.fcmToken);
        console.log(`📲 Found FCM token for ${appt.patientName || appt.patientId}`);
      } else {
        console.warn(`⚠️ No FCM token for patient ${appt.patientId}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching FCM token for patient ${appt.patientId}:`, error);
    }
  }

  return tokens;
};
