import admin from 'firebase-admin';

// Parse Firebase credentials from the correct environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    ...serviceAccount,
    private_key: serviceAccount.private_key.replace(/\\n/g, '\n') // Fix line breaks
  }),
});

// Export Firestore and Messaging services
export const db = admin.firestore();
export const messaging = admin.messaging();
export default admin;
