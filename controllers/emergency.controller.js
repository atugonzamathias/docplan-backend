import { db } from '../config/firebase.js';
import { sendFCM } from '../services/fcm.service.js';
import { rescheduleAppointments } from '../services/reschedule.service.js';

export const resolveEmergency = async (req, res) => {
  try {
    const emergencyId = req.params.id;
    const doctorId = req.body.doctorId;
    const emergencyRef = db.collection("emergencies").doc(emergencyId);
    const emergencySnap = await emergencyRef.get();
    if (!emergencySnap.exists) return res.status(404).send("Emergency not found");

    const emergency = emergencySnap.data();
    const start = new Date(emergency.startTime);
    const end = new Date();
    const duration = end.getTime() - start.getTime();

    await emergencyRef.update({
      resolved: true,
      endTime: end.toISOString(),
      status: "resolved"
    });

    const affected = await rescheduleAppointments(doctorId, duration);
    for (const a of affected) {
      await sendFCM(a.fcmToken, "Appointment Rescheduled", `New time: ${a.newTime}`, {
        type: "reschedule",
        new_time: a.newTime
      });
    }
    res.status(200).send("Emergency resolved and appointments rescheduled.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error resolving emergency");
  }
};