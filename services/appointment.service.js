import { db, admin } from '../config/firebase.js'; // admin must be initialized in firebase.js

// ✅ Get appointments within 2 hours for a doctor (excluding emergencies)
export const getAppointmentsWithinTwoHours = async (doctorId) => {
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  try {
    const snapshot = await db.collection('appointments')
      .where('doctorId', '==', doctorId)
      .where('isEmergency', '==', false) // ✅ Fix here
      .where('dateTime', '>=', admin.firestore.Timestamp.fromDate(now))
      .where('dateTime', '<=', admin.firestore.Timestamp.fromDate(twoHoursLater))
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching appointments within 2 hours:", error);
    return [];
  }
};

// ✅ Freeze appointments by setting status to 'frozen'
export const freezeAppointments = async (appointments) => {
  const updates = appointments.map(appt =>
    db.collection('appointments').doc(appt.id).update({ status: 'frozen' })
  );

  try {
    await Promise.all(updates);
    console.log('Appointments successfully frozen');
  } catch (error) {
    console.error("Error freezing appointments:", error);
  }
};

// ✅ Fetch patient FCM tokens from user documents
export const getPatientFcmTokens = async (appointments) => {
  const tokens = [];

  for (const appt of appointments) {
    try {
      const userSnap = await db.collection('users').doc(appt.patientId).get();
      const user = userSnap.data();
      if (user?.fcmToken) {
        tokens.push(user.fcmToken);
      }
    } catch (error) {
      console.error(`Error fetching FCM token for patient ${appt.patientId}:`, error);
    }
  }

  return tokens;
};
