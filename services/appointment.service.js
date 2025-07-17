import { db } from '../config/firebase.js';

export const getAppointmentsWithinTwoHours = async (doctorId) => {
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const snapshot = await db.collection('appointments')
    .where('doctorId', '==', doctorId)
    .where('isEmergency', '!=', true)
    .where('dateTime', '>=', now.toISOString())
    .where('dateTime', '<=', twoHoursLater.toISOString())
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const freezeAppointments = async (appointments) => {
  const updates = appointments.map(appt =>
    db.collection('appointments').doc(appt.id).update({ status: 'frozen' })
  );
  await Promise.all(updates);
};

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
      console.error(`Error fetching token for patient ${appt.patientId}:`, error);
    }
  }

  return tokens;
};
