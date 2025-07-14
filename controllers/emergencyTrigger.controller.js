import { db } from '../config/firebase.js';
import { sendFCM } from '../services/fcm.service.js';

export const triggerEmergency = async (req, res) => {
  try {
    const { doctorId, patientId, patientName, note } = req.body;
    const startTime = new Date().toISOString();

    // 1. Create emergency record
    const emergencyRef = await db.collection("emergencies").add({
      doctorId,
      patientId,
      patientName,
      note,
      received: false,
      resolved: false,
      startTime,
      status: "active"
    });

    const emergencyId = emergencyRef.id;

    // 2. Notify doctor
    const doctorSnap = await db.collection("users").doc(doctorId).get();
    const doctorToken = doctorSnap.data().fcmToken;

    await sendFCM(
      doctorToken,
      "Emergency Alert",
      `Patient ${patientName} triggered an emergency.`,
      {
        type: "emergency",
        doctorId,
        emergencyId,
      }
    );

    // 3. Freeze appointments within next 2 hours
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const apptSnap = await db.collection("appointments")
      .where("doctorId", "==", doctorId)
      .where("status", "==", "upcoming")
      .get();

    for (const doc of apptSnap.docs) {
      const appt = doc.data();
      const apptRef = doc.ref;

      // ✅ Properly parse local time
      const [hour, minute] = appt.slotTime.split(" - ")[0].split(":").map(Number);
      const [year, month, day] = appt.date.split("-").map(Number);
      const slotStart = new Date(year, month - 1, day, hour, minute); // Local time

      const shouldFreeze = slotStart >= now && slotStart <= twoHoursLater;

      if (shouldFreeze) {
        await apptRef.update({ status: "frozen" });

        // 🔔 Notify patient
        const patientSnap = await db.collection("users").doc(appt.patientId).get();
        await sendFCM(
          patientSnap.data().fcmToken,
          "Appointment Frozen",
          "Your appointment is temporarily frozen due to an emergency.",
          {
            type: "frozen",
          }
        );
      }

      // 🐞 Optional: Debug log for verification
      console.log({
        patient: appt.patientName,
        slotStart: slotStart.toString(),
        now: now.toString(),
        shouldFreeze
      });
    }

    res.status(201).send({ message: "Emergency triggered and doctor notified." });
  } catch (error) {
    console.error("🔥 Error triggering emergency:", error);
    res.status(500).send("Failed to trigger emergency");
  }
};
