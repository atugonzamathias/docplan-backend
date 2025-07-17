import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import emergencyRoutes from './routes/emergency.routes.js';
import './config/firebase.js'; // Firebase initialized here
import listenForEmergencies from './listeners/emergency.listener.js'; // 👈 Listener import

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/emergencies', emergencyRoutes);

// Start listening to Firestore emergencies
listenForEmergencies(); // 👈 Starts real-time emergency listener

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

