import { db } from '../config/firebase.js';
import { sendFCM } from '../services/fcm.service.js';

export const triggerEmergency = async (req, res) => {
  try {
    const { doctorId, patientId, patientName, note } = req.body;
    const startTime = new Date().toISOString();
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

    const doctorSnap = await db.collection("users").doc(doctorId).get();
    const doctorToken = doctorSnap.data().fcmToken;
    await sendFCM(doctorToken, "Emergency Alert", `Patient ${patientName} triggered an emergency.`, { type: "emergency" });

    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const apptSnap = await db.collection("appointments")
      .where("doctorId", "==", doctorId)
      .where("status", "==", "upcoming")
      .get();

    for (const doc of apptSnap.docs) {
      const appt = doc.data();
      const slotStart = new Date(`${appt.date}T${appt.slotTime.split(" - ")[0]}:00`);
      if (slotStart >= now && slotStart <= twoHoursLater) {
        await doc.ref.update({ status: "frozen" });
        const patient = await db.collection("users").doc(appt.patientId).get();
        await sendFCM(patient.data().fcmToken, "Appointment Frozen", "Your appointment is temporarily frozen due to an emergency.", { type: "frozen" });
      }
    }

    res.status(201).send({ message: "Emergency triggered and doctor notified." });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to trigger emergency");
  }
};
