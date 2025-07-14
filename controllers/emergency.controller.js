import { db } from '../config/firebase.js';
import { sendFCM } from '../services/fcm.service.js';
import { rescheduleAppointments } from '../services/reschedule.service.js';

export const resolveEmergency = async (req, res) => {
  try {
    const emergencyId = req.params.id;
    const doctorId = req.body.doctorId;

    const emergencyRef = db.collection("emergencies").doc(emergencyId);
    const emergencySnap = await emergencyRef.get();

    if (!emergencySnap.exists) {
      return res.status(404).send("Emergency not found");
    }

    const emergency = emergencySnap.data();
    const start = new Date(emergency.startTime);
    const end = new Date();
    const duration = end.getTime() - start.getTime();

    // ✅ Mark emergency as resolved
    await emergencyRef.update({
      resolved: true,
      endTime: end.toISOString(),
      status: "resolved",
    });

    // ✅ Reschedule affected appointments
    const affectedAppointments = await rescheduleAppointments(doctorId, duration);

    for (const appointment of affectedAppointments) {
      const isRescheduled = appointment.originalTime !== appointment.newTime;

      await sendFCM(
        appointment.fcmToken,
        isRescheduled ? "Appointment Rescheduled" : "Appointment Restored",
        isRescheduled
          ? `Your appointment has been rescheduled to ${appointment.newTime}.`
          : `Your appointment remains scheduled at ${appointment.newTime}.`,
        {
          type: isRescheduled ? "reschedule" : "restored",
          new_time: appointment.newTime,
        }
      );
    }

    return res.status(200).send("Emergency resolved and appointments updated.");
  } catch (error) {
    console.error("❌ Error resolving emergency:", error);
    return res.status(500).send("Error resolving emergency");
  }
};

export const getActiveEmergency = async (req, res) => {
  const { doctorId } = req.query;

  if (!doctorId) {
    return res.status(400).json({ error: 'doctorId is required' });
  }

  try {
    const snapshot = await db
      .collection('emergencies')
      .where('doctorId', '==', doctorId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ hasActive: false });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return res.status(200).json({
      hasActive: true,
      id: doc.id,
      patientId: data.patientId,
      patientName: data.patientName,
      note: data.note,
      startTime: data.startTime,
    });
  } catch (error) {
    console.error('❌ Error checking active emergency:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
