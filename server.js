import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import emergencyRoutes from './routes/emergency.routes.js';
import './config/firebase.js'; // Firebase initialized here

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use('/api/emergencies', emergencyRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
