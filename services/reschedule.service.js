import { db } from '../config/firebase.js';
import { shiftSlotTime } from '../utils/time.utils.js';

export const rescheduleAppointments = async (doctorId, duration) => {
  const results = [];
  const now = new Date();

  const apptsSnap = await db.collection("appointments")
    .where("doctorId", "==", doctorId)
    .where("status", "==", "frozen")
    .get();

  for (const doc of apptsSnap.docs) {
    const appt = doc.data();
    const [startStr] = appt.slotTime.split(" - ");
    const slotStart = new Date(`${appt.date}T${startStr}:00`);
    const patientSnap = await db.collection("users").doc(appt.patientId).get();
    const fcmToken = patientSnap.data().fcmToken;

    if (slotStart < now) {
      const newTime = shiftSlotTime(appt.slotTime, duration);
      await doc.ref.update({
        slotTime: newTime,
        status: "rescheduled",
        updatedAt: new Date().toISOString()
      });
      results.push({
        patientId: appt.patientId,
        fcmToken,
        newTime,
        originalTime: appt.slotTime
      });
    } else {
      await doc.ref.update({ status: "upcoming" });
      results.push({
        patientId: appt.patientId,
        fcmToken,
        newTime: appt.slotTime,
        originalTime: appt.slotTime
      });
    }
  }

  return results;
};
