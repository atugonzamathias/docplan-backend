import admin from 'firebase-admin';
import dotenv from 'dotenv';
import serviceAccount from '../service-account.json' assert { type: "json" };

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const db = admin.firestore();
export const messaging = admin.messaging();