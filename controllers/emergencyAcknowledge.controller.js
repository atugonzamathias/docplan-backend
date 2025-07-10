import { db } from '../config/firebase.js';
import { sendFCM } from '../services/fcm.service.js';

export const acknowledgeEmergency = async (req, res) => {
  try {
    const emergencyId = req.params.id;
    const emergencyRef = db.collection("emergencies").doc(emergencyId);
    const emergencySnap = await emergencyRef.get();
    if (!emergencySnap.exists) return res.status(404).send("Emergency not found");

    const emergency = emergencySnap.data();
    await emergencyRef.update({ received: true });

    const patientSnap = await db.collection("users").doc(emergency.patientId).get();
    await sendFCM(patientSnap.data().fcmToken, "Doctor Acknowledged Emergency", "Your doctor is now attending to your emergency.", { type: "acknowledged" });

    res.status(200).send("Emergency acknowledged.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error acknowledging emergency");
  }
};