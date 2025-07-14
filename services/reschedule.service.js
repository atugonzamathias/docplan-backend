import { db } from "../config/firebase.js";
import {
  getDurationInMs,
  shiftSlotTime,
  getDayNameFromDate,
} from "../utils/time.utils.js";

export const rescheduleAppointments = async (doctorId, emergencyDuration) => {
  const now = new Date();
  const results = [];

  // Get frozen appointments
  const apptsSnap = await db.collection("appointments")
    .where("doctorId", "==", doctorId)
    .where("status", "==", "frozen")
    .get();

  // Get available slots
  const slotsSnap = await db.collection("slots")
    .where("doctorId", "==", doctorId)
    .where("status", "==", "available")
    .get();

  const availableSlots = slotsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  for (const doc of apptsSnap.docs) {
    const appt = doc.data();
    const apptRef = doc.ref;
    const apptDuration = getDurationInMs(appt.slotTime);
    const originalTime = appt.slotTime;

    let matchedSlot = null;

    for (const slot of availableSlots) {
      const slotDate = slot.date ? new Date(slot.date) : null;
      const isFutureDate = !slotDate || slotDate >= now;
      const isCorrectRecurringDay =
        !slotDate &&
        slot.isRecurring &&
        getDayNameFromDate(appt.date) === slot.dayOfWeek;

      if ((slotDate && isFutureDate) || isCorrectRecurringDay) {
        const slotDuration = getDurationInMs(`${slot.startTime} - ${slot.endTime}`);
        if (slotDuration === apptDuration) {
          matchedSlot = slot;
          break;
        }
      }
    }

    if (matchedSlot) {
      // Format new slotTime
      const newSlotTime = `${matchedSlot.startTime} - ${matchedSlot.endTime}`;
      const newDate = matchedSlot.date
        ? new Date(matchedSlot.date).toISOString().slice(0, 10)
        : appt.date;

      // Update appointment
      await apptRef.update({
        slotTime: newSlotTime,
        date: newDate,
        slotId: matchedSlot.id,
        status: "rescheduled",
        updatedAt: new Date().toISOString(),
      });

      // Mark slot as booked
      await db.collection("slots").doc(matchedSlot.id).update({ status: "booked" });

      const patientSnap = await db.collection("users").doc(appt.patientId).get();

      results.push({
        patientId: appt.patientId,
        fcmToken: patientSnap.data().fcmToken,
        originalTime,
        newTime: newSlotTime,
      });

    } else {
      // No match: restore to upcoming
      await apptRef.update({
        status: "upcoming",
        updatedAt: new Date().toISOString(),
      });

      const patientSnap = await db.collection("users").doc(appt.patientId).get();

      results.push({
        patientId: appt.patientId,
        fcmToken: patientSnap.data().fcmToken,
        originalTime,
        newTime: originalTime,
      });
    }
  }

  return results;
};
